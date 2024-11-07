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
    }
}

function formViewSelect(section, sections) {
    formViewHideAll(sections) ;
    let qstr = '#' + section ;
    $(qstr).show() ;
}

function formViewCreateTabBar(sections) {
    let bardiv = document.createElement('div') ;
    bardiv.className = 'formtab' ;

    for(let section of sections) {
        let button = document.createElement('button') ;
        button.innerText = section ;
        button.className = 'form-tab-button' ;
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
    lin.scouttag = item.tag ;
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

    select.scouttag = item.tag ;
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
    lin.scouttag = item.tag ;

    label.for = lin ;
    div.append(label) ;
    div.append(lin) ;
    return div ;
}

function incrUpDown(item) {
    let numstr = item.textContent ;
    let num = parseInt(numstr) ;
    num++ ;
    item.textContent = num ;
}

function decrUpDown(item) {
    let numstr = item.textContent ;
    let num = parseInt(numstr) ;
    num-- ;
    item.textContent = num ;
}

function formViewCreateUpdown(item) {
    let div = document.createElement('div') ;
    div.className = 'form-item-updown-div' ;
    let label = document.createElement('p') ;
    label.className = 'form-item-label' ;
    label.textContent = item.name ;

    let count = document.createElement('p') ;
    count.innerText = '0' ;
    count.scouttag = item.tag ;
    count.className = 'form-item-updown' ;

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
    if (obj.form !== ftype) {
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