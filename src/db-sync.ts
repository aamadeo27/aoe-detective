import dao from './dao'
// main()
const MIN = 60*1000
dao.init(() => {
  dao.updateDB()
  setInterval(dao.updateDB, 5 * MIN)
})
