#!/bin/bash
set -e -o pipefail

# EBS/Mounting
EBS_DEVICE_NAME="/dev/sdf"
DATABASE_PATH="/data"
CONTAINER_DATA_PATH="/usr/app/data"
FILESYSTEM_TYPE="ext4"

# Application/Docker
APP_NAME="nabbot"
APP_DIR="/opt/${APP_NAME}"
DOCKER_IMAGE_NAME="aamadeo/nabbot:latest"
DOCKER_PLUGINS="/usr/libexec/docker/cli-plugins"
COMPOSE_VERSION="v2.24.6"
CONTAINER_NAME="${APP_NAME}-container"

# AWS Specifics
AWS_REGION="us-east-1"

# DATABASE
DATABASE_TARGET_PATH="${DATABASE_PATH}/nabs.sqlite"

### Pasos Manuales

# --- Script Logic ---

echo "--- Starting Application Setup Script ---"
LOG_FILE="/var/log/setup_app.log"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root (or using sudo)." >&2
  exit 1
fi

# --- Install Docker and Docker Compose Plugin ---
echo "Updating packages and installing Docker + Compose Plugin..."
yum update -y
if ! command -v docker &> /dev/null; then
    amazon-linux-extras install docker -y
    systemctl enable docker --now
    usermod -a -G docker ec2-user # Add default user to docker group
    echo "Docker installed."
else
    echo "Docker already installed."
    # Ensure Docker service is running
    if ! systemctl is-active --quiet docker; then
        systemctl start docker
    fi
    systemctl enable docker --now # Ensure it's enabled anyway
fi

if ! docker compose version &> /dev/null; then
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o "$DOCKER_PLUGINS/docker-compose"
    chmod +x "$DOCKER_PLUGINS/docker-compose"
    echo "Docker Compose Plugin installed."
else
    echo "Docker Compose Plugin already installed."
fi
echo "Docker and Compose Plugin setup complete."


# --- Mount EBS Volume ---
echo "Checking for EBS volume at ${EBS_DEVICE_NAME}..."
if [ ! -b "${EBS_DEVICE_NAME}" ]; then
    echo "ERROR: EBS device ${EBS_DEVICE_NAME} not found. Ensure it's attached." >&2
    exit 1
fi
echo "Device ${EBS_DEVICE_NAME} found."

if ! file -s "${EBS_DEVICE_NAME}" | grep -q "${FILESYSTEM_TYPE} filesystem"; then
    echo "No ${FILESYSTEM_TYPE} filesystem found on ${EBS_DEVICE_NAME}. Creating filesystem..."
    mkfs -t "${FILESYSTEM_TYPE}" "${EBS_DEVICE_NAME}"
else
    echo "Filesystem already exists on ${EBS_DEVICE_NAME}."
fi

if ! findmnt --source "${EBS_DEVICE_NAME}" --noheadings; then
    echo "Mounting ${EBS_DEVICE_NAME} to ${DATABASE_PATH}..."
    mkdir -p "${DATABASE_PATH}"
    mount "${EBS_DEVICE_NAME}" "${DATABASE_PATH}"

    chown ec2-user:ec2-user "${DATABASE_PATH}"
    chmod 750 "${DATABASE_PATH}"
    echo "Mounted ${EBS_DEVICE_NAME}."
else
    echo "${EBS_DEVICE_NAME} already mounted at $(findmnt --source ${EBS_DEVICE_NAME} --noheadings --output TARGET)."
    mkdir -p "${DATABASE_PATH}"
fi

echo "Checking /etc/fstab..."
UUID=$(blkid -s UUID -o value "${EBS_DEVICE_NAME}")
if [ -z "$UUID" ]; then
    echo "WARNING: Could not get UUID for ${EBS_DEVICE_NAME}. Cannot add to /etc/fstab reliably by UUID."
else
    FSTAB_ENTRY="UUID=${UUID}  ${DATABASE_PATH}  ${FILESYSTEM_TYPE}  defaults,nofail  0  2"
    if ! grep -q "UUID=${UUID}" /etc/fstab; then
        echo "Adding mount to /etc/fstab..."
        echo "${FSTAB_ENTRY}" >> /etc/fstab
        echo "Added."
    else
        echo "Mount point already in /etc/fstab."
    fi
fi

echo "Creating app directory ${APP_DIR} and changing into it..."
mkdir -p "${APP_DIR}"
chown ec2-user:ec2-user "${APP_DIR}"
cd "${APP_DIR}"

echo "--- Application Setup Script Finished ---"

exit 0