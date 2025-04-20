terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  # Ensure AWS credentials are configured (env vars, shared file, etc.)
}

# ---- Variables ----
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "volume_size_gb" {
  description = "Size (GiB) of the EBS volume"
  type        = number
  default     = 8
}

variable "app_name" {
  description = "Base name for tagging resources"
  type        = string
  default     = "nabbot"
}

variable "ssh_public_key_path" {
  description = "Path to your SSH public key file (e.g., ~/.ssh/my-app-key.pub)"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access (e.g., 'YOUR_IP/32'). Use '0.0.0.0/0' ONLY for testing/less security."
  type        = string
  default     = "0.0.0.0/0" 
}

variable "availability_zone" {
  description = "Specific Availability Zone. If empty, one will be chosen. Instance and Volume MUST be in the same AZ."
  type        = string
  default     = "us-east-1a"
}

# ---- Data Sources ----

# Get the latest Amazon Linux 2 AMI ID
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get available Availability Zones in the selected region
data "aws_availability_zones" "available" {
  state = "available"
}

# ---- Locals ----
locals {
  # Use the specified AZ or pick the first available one if none is provided
  az = coalesce(var.availability_zone, data.aws_availability_zones.available.names[0])
}

# ---- Resources ----

# Import the SSH public key to AWS EC2 Key Pairs
resource "aws_key_pair" "deployer_key" {
  key_name   = "${var.app_name}-key"
  public_key = file(var.ssh_public_key_path)

  tags = {
    Name = "${var.app_name}-key"
  }
}

# Security Group to allow SSH access
resource "aws_security_group" "allow_ssh" {
  name        = "${var.app_name}-ssh-sg"
  description = "Allow SSH inbound traffic from specified CIDR and all outbound"

  ingress {
    description = "SSH from Allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ssh-sg"
  }
}

resource "aws_ebs_volume" "app_data_volume" {
  availability_zone = local.az
  size              = var.volume_size_gb
  type              = "gp3"
  tags = {
    Name = "${var.app_name}-data-volume"
  }
}


resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  availability_zone      = local.az
  key_name               = aws_key_pair.deployer_key.key_name
  vpc_security_group_ids = [aws_security_group.allow_ssh.id]

  tags = {
    Name = "${var.app_name}-instance"
  }

  depends_on = [
    aws_key_pair.deployer_key,
    aws_security_group.allow_ssh
  ]
}

# Attach the EBS volume to the EC2 instance
resource "aws_volume_attachment" "ebs_attachment" {
  device_name = "/dev/sdf" # Common device name for attached volumes on Linux
  volume_id   = aws_ebs_volume.app_data_volume.id
  instance_id = aws_instance.app_server.id

  # Ensure instance and volume exist before attaching
  depends_on = [
    aws_instance.app_server,
    aws_ebs_volume.app_data_volume
  ]
}

# ---- Outputs ----
output "instance_id" {
  description = "ID of the created EC2 instance"
  value       = aws_instance.app_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.app_server.public_dns
}

output "ebs_volume_id" {
  description = "ID of the created EBS volume"
  value       = aws_ebs_volume.app_data_volume.id
}

output "ssh_command" {
  description = "Command to SSH into the instance (replace with your private key path)"
  # Note: Uses public DNS which might take a moment to propagate after creation. IP is often faster initially.
  value       = "ssh -i /path/to/your/private/key/${aws_key_pair.deployer_key.key_name}.pem ec2-user@${aws_instance.app_server.public_dns}"
  # Or using IP: value = "ssh -i /path/to/your/private/key/my-app-key ec2-user@${aws_instance.app_server.public_ip}"
}

output "ebs_device_name" {
  description = "Device name assigned to the EBS volume on the instance"
  value       = aws_volume_attachment.ebs_attachment.device_name
}

output "availability_zone_used" {
  description = "The Availability Zone where resources were deployed"
  value       = local.az
}