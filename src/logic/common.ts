import dao from "../db"

export const removeAccents = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const getNab = async (name: string, i?: number, current?) => name.match(/^\$(T|G)$/) 
  ? [{ name: 'Vagabundo' + (i+1), elo: name === '$T' ? 1800 : 1700 }]
  : name.match(/^\".+\"$/) 

  ? dao.getNabByName(name.substring(1, name.length-1))
  : name.match(/^#.+$/) // if by ID using #ID

  ? [await dao.getNabById(parseInt(name.substring(1)))]

  : name.match(/^\$\d+$/) // if by ELO using $ELO
  ? [{ name: 'Player ' + (i+1), elo: parseInt(name.substring(1), 10)}]

  : dao.getNabLike(name, current)


export const updateNameIndex = async () => {
  const names = await dao.allNames()

  for(let n = 0 ; n < names.length ; n++) {
    names[n].name_idx = removeAccents(names[n].name)
     
    await dao.updateNameIdx(names[n])
  }
}