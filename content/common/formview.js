const buttonClassUnselected = 'form-tab-button-unselected' ;
const buttonClassSelected = 'form-tab-button-selected' ;

function formViewNormalizeName(name) { 
    let ret = '' ;

    for(let ch of name) {
        if (ch.match(/[a-z]/i)) {
            ret += ch ;
        }
        else {
            ret += '_' ;
        }
    }

    return ret ;
}

function formViewHideAll(sections) {
    for(let section of sections) {
        let qstr = '#' + section ;
        $(qstr).hide() ;

        qstr = '#' + section + '-button' ;
        $(qstr).css("border", "none") ;
    }
}

function formViewSelect(section, sections) {
    formViewHideAll(sections) ;
    let qstr = '#' + section ;
    $(qstr).show() ;

    qstr = '#' + section + '-button' ;
    $(qstr).css("border", "3px solid black" );
}

function formViewCreateTabBar(sections) {
    let bardiv = document.createElement('div') ;
    bardiv.className = 'formtab' ;

    for(let section of sections) {
        let button = document.createElement('button') ;
        button.innerText = section ;
        button.className = buttonClassUnselected ;
        button.id = section + '-button' ;
        button.onclick = () => { formViewSelect (section, sections) ; }
        bardiv.append(button) ;
    }

    return bardiv ;
}

//
// maxlen
//
function formViewCreateText(item) {
    let div = document.createElement('div') ;
    let label = document.createElement('label') ;
    label.className = 'form-item-label' ;
    label.textContent = item.name ;

    let lin = document.createElement('input') ;
    lin.className = 'form-item-text' ;
    lin.setAttribute("type", "text");
    if (item.maxlen) {
        lin.maxLength = item.maxlen ;
    }
    lin.xerotag = item.tag ;
    lin.xerotype = 'text' ;
    lin.xerovalue = '' ;
    lin.addEventListener('input', function() {
        lin.xerovalue = lin.value ;
    }) ;
    label.for = lin ;
    div.append(label) ;
    div.append(lin) ;
    return div ;
}

function formViewCreateChoice(item) {
    let div = document.createElement('div') ;
    let label = document.createElement('label') ;
    label.className = 'form-item-label' ;
    label.textContent = item.name ;

    const select = document.createElement('select');
    select.className = 'form-item-choice' ;

    for(let choice of item.choices) {
        const opt = document.createElement('option');    
        opt.value = choice ;
        opt.text = choice ;
        select.append(opt) ;
    }
    select.xerovalue = item.choices[0] ;

    select.addEventListener("change", function() {
        select.xerovalue = select.value ;
    });

    select.xerotag = item.tag ;
    select.xerotype = 'select' ;
    
    label.for = select ;
    div.append(label) ;
    div.append(select) ;
    return div ;    
}

function formViewCreateBoolean(item) {
    let div = document.createElement('div') ;
    let label = document.createElement('label') ;
    label.className = 'form-item-label' ;
    label.textContent = item.name ;

    let lin = document.createElement('input') ;
    lin.className = 'form-item-boolean' ;
    lin.setAttribute("type", "checkbox");
    lin.xerovalue = false;

    lin.addEventListener('change', (event) => {
        lin.xerovalue = event.target.checked ;
    });

    lin.xerotag = item.tag ;
    lin.xerotype = 'boolean' ;

    label.for = lin ;
    div.append(label) ;
    div.append(lin) ;
    return div ;
}

function incrUpDown(item) {
    let numstr = item.textContent ;
    let num = parseInt(numstr) ;
    if (num < item.maximumValue) {
        num++ ;
    }
    item.textContent = num ;
    item.xerovalue = num ;
}

function decrUpDown(item) {
    let numstr = item.textContent ;
    let num = parseInt(numstr) ;
    if (num > item.minimumValue) {
        num-- ;
    }
    item.textContent = num ;
    item.xeroValue = num ;
}

function formViewCreateUpdown(item) {
    let div = document.createElement('div') ;
    div.className = 'form-item-updown-div' ;
    let label = document.createElement('p') ;
    label.className = 'form-item-label' ;
    label.textContent = item.name ;

    let count = document.createElement('p') ;
    count.innerText = '0' ;
    count.xerotag = item.tag ;
    count.xerotype = 'updown' ;
    count.className = 'form-item-updown' ;
    count.minimumValue = item.minimum;
    count.maximumValue = item.maximum ;
    count.xerovalue = 0 ;

    let plus = document.createElement('button') ;
    plus.className = 'form-item-updown-button' ;
    plus.textContent = '+' ;
    plus.onclick = () => { incrUpDown(count) } ;

    let minus = document.createElement('button') ;
    minus.className = 'form-item-updown-button' ;
    minus.textContent = '-' ;
    minus.onclick = () => { decrUpDown(count) } ;

    div.append(label) ;
    div.append(minus) ;
    div.append(count) ;
    div.append(plus) ;
    return div ;
}

function formViewCreateItem(item) {
    let div ;
    if (item.type === 'text') {
        div = formViewCreateText(item) ;
    }
    else if (item.type === 'choice') {
        div = formViewCreateChoice(item) ;
    }
    else if (item.type === 'boolean') {
        div = formViewCreateBoolean(item) ;
    }
    else if (item.type === 'updown') {
        div = formViewCreateUpdown(item) ;
    }
    return div ;
}

function formViewCreateSection(section) {
    let secname = formViewNormalizeName(section.name) ;
    let secdiv = document.createElement('div') ;
    secdiv.id = secname ;
    for(let item of section.items) {
        secdiv.append(formViewCreateItem(item)) ;
    }

    return secdiv ;
}

function formViewJsonToForm(parent, obj, ftype) {
    let div = document.createElement('div') ;
    if (obj.form !== ftype && ftype !== 'preview') {
        let msg = "<b>The form is not the correct type." ;
        msg += 'Expected a form of type \'' + ftype + '\', but got a form of type \'' + obj.form + '\'.' ;
        div.innerHTML = msg;
        parent.append(div) ;
    }
    else if (!obj.sections || !Array.isArray(obj.sections)) {
        let msg = "<b>The form is not a valid form JSON object." ;
        msg += 'A field of named \'sections\' is required and should be an array of items.';
        div.innerHTML = msg;
        parent.append(div) ;
    }
    else {
        let sectnames = [] ;
        for(let section of obj.sections) {
            sectnames.push(formViewNormalizeName(section.name)) ;
        }
        div.append(formViewCreateTabBar(sectnames)) ;

        for(let section of obj.sections) {
            let secdiv = formViewCreateSection(section) ;
            div.append(secdiv) 
        }

        parent.append(div) ;
        formViewSelect(sectnames[0], sectnames) ;
    }
}

function returnResultRecursively(elem, result) {
    if (elem.xerotag) {
        let one = {
            tag: elem.xerotag,
            type: elem.xerotype,
            value: elem.xerovalue
        } ;
        result.push(one) ;
    }

    for(let child of elem.childNodes) {
        returnResultRecursively(child, result) ;
    }
}

function returnResult() {
    //
    // Extract the results from the form and send to the main process
    //
    const element = document.getElementById("rightcontent");
    let result = [] ;
    returnResultRecursively(element, result) ;
    window.scoutingAPI.send("provide-result", result);
}

function findElemByTag(elem, tag) {
    if (elem.xerotag === tag) {
        return elem ;
    }

    for(let child of elem.childNodes) {
        let answer = findElemByTag(child, tag)
        if (answer) {
            return answer ;
        }
    }

    return undefined ;
}

function setXeroValue(elem, one) {
    if (one.value) {
        elem.xerovalue = one.value ;
        if (one.type === 'text') {
            elem.value = one.value ;
        }
        else if (one.type === 'updown') {
            elem.innerText = one.value ;
        }
        else if (one.type === 'boolean') {
            elem.checked = one.value ;
        }
        else if (one.type === 'choice') {
            elem.value = one.value ;
        }
    }
}

function sendResultValues(arg) {
    //
    // Initialize the form with existing form values
    //
    const top = document.getElementById("rightcontent");
    for(let one of arg) {
        let elem = findElemByTag(top, one.tag) ;
        setXeroValue(elem, one) ;
    }
}

window.scoutingAPI.receive("request-result", (args)=>returnResult()) ;
window.scoutingAPI.receive("send-result-values", (args)=>sendResultValues(args[0])) ;