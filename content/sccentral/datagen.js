let adown = false ;
let sdown = false ;
let ddown = false ;
let fdown = false ;

document.addEventListener('keyup', function(event) {
  if (event.key == 'a') {
    adown = false ;
  }
  else if (event.key == 's') {
    sdown = false ;
  }
  else if (event.key == 'd') {
    ddown = false ;
  }
  else if (event.key == 'f') {
    fdown = false ;
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key == 'a') {
    adown = true ;
  }
  else if (event.key == 's') {
    sdown = true ;
  }
  else if (event.key == 'd') {
    ddown = true ;
  }
  else if (event.key == 'f') {
    fdown = true ;
  }

  if (adown && sdown && ddown && fdown) {
    window.scoutingAPI.send("generate-random-data");
    adown = false ;
    sdown = false ;
    ddown = false ;
    fdown = false ;
  }
});
