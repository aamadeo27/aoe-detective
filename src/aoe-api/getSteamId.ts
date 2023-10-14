let axios = require('axios')

//create axios instance from which we will get to the search list
let instance = axios.create({ baseURL: 'https://steamcommunity.com' })

async function getSessionId() {

  let res = await axios.get('https://steamcommunity.com/');
  
  let [cookie] = res.headers['set-cookie'];
  
  instance.defaults.headers.Cookie = cookie;
  
  return cookie;

}

getSessionId().then(cookie => {

  let session = cookie.split(' ')[0].slice(10, -1);
  instance.get(`https://steamcommunity.com/search/SearchCommunityAjax?text=efffdis&filter=users&sessionid=${session}&steamid_user=false&page=1`).then(res => {
  
    //i have regex
    let regex = new RegExp("/('<div>')/|/('<img>')/|/('<span>')/g")
    
    //html also
    let arr = res.data.html.split(regex).join('').split('\t').join('').split('\n').join('').split('\r')

    arr = arr.filter(a => a !== '')
    
    arr = arr.filter(a => a.includes("searchPersonaName"))
    
    let result = []

    arr.forEach(a => {
      let [link, name] = a.replace('<a class="searchPersonaName" href="','').replace('</a><br />','').split('">');

      let obj = { link, name }
      result.push(obj);
    })

    console.log(result); //logs out array of objects with links and usernames
  
  })
  
})