import { makeTeamsAnonymous } from "@/logic/teams"

export default async function tg(say: (comment: string) => void, data: string) {
    if (data.match(/[^0-9\s]/g)) {
        return say(`${data} is invalid. It should only be space separated numbers. Example: 2500 2300 2200 1899 1774 1600`)
    }

    if (data.split(' ').length % 2 === 1) {
        return say(`${data} is invalid. It should be an even number of players`)
    }

    const teamData = await makeTeamsAnonymous(data)

    console.log(teamData)
    return say(`${teamData.division.selector} - ${teamData.division.selector2} - T1: ${teamData.division.teams[0].elo} T2: ${teamData.division.teams[1].elo} `)
}