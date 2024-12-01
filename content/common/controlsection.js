class XeroControlSection extends XeroBaseSection {
    // name - the normalized name of the section
    // json - the json that contains the information about what controls to create
    constructor(json, color) {
        super(json.name, false, document.createElement('div'));

        this.name_  = XeroBaseSection.formViewNormalizeName(json.name) ;
        this.top_.id = this.name_ ;

        for(let item of json.items) {
            this.top_.append(this.formViewCreateItem(item)) ;
        }

        this.color_ = color ;
    }

    formViewCreateText(item) {
        let rows, cols ;

        if (item.rows) {
            rows = item.rows ;
        }

        if (item.cols) {
            cols = item.cols;
        }

        let div = document.createElement('div') ;
        let label = document.createElement('label') ;
        label.className = 'form-item-label' ;
        label.textContent = item.name ;
        
        let lin ;

        if (!rows) {
            lin = document.createElement('input') ;
            label.append(lin) ;
            lin.className = 'form-item-text' ;
            lin.setAttribute("type", "text");
            if (item.maxlen) {
                lin.maxLength = item.maxlen ;
            }
            if (cols) {
                lin.size = cols ;
            }
            lin.xerotag = item.tag ;
            lin.xerotype = 'text' ;
            lin.xerovalue = '' ;
        }
        else {
            lin = document.createElement('textarea');
            lin.rows = rows ;
            lin.cols = cols ;
            lin.className = 'form-item-text' ;
            if (item.maxlen) {
                lin.maxLength = item.maxlen ;
            }
            lin.xerotag = item.tag ;
            lin.xerotype = 'text' ;
            lin.xerovalue = '' ;
        }
        lin.addEventListener('input', function() {
            lin.xerovalue = lin.value ;
        }) ;
        label.append(lin) ;
        div.append(label) ;
        return div ;
    }
    
    formViewCreateChoice(item) {
        let div = document.createElement('div') ;
        let label = document.createElement('label') ;
        label.className = 'form-item-label' ;
        label.textContent = item.name ;
    
        const select = document.createElement('select');
        label.append(select) ;
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
        return div ;    
    }
    
    formViewCreateBoolean(item) {
        let div = document.createElement('div') ;
        let label = document.createElement('label') ;
        label.className = 'form-item-label' ;
        label.textContent = item.name ;
    
        let lin = document.createElement('input') ;
        label.append(lin) ;
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
        return div ;
    }
    
    incrUpDown(item, ev) {
        let numstr = item.textContent ;
        let num = parseInt(numstr) ;
        if (num < item.maximumValue) {
            num++ ;
        }
        item.textContent = num ;
        item.xerovalue = num ;
    }
    
    decrUpDown(item, ev) {
        let numstr = item.textContent ;
        let num = parseInt(numstr) ;
        if (num > item.minimumValue) {
            num-- ;
        }
        item.textContent = num ;
        item.xeroValue = num ;
    }
    
    formViewCreateUpdown(item) {
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
        plus.onclick = this.incrUpDown.bind(this, count) ;
    
        let minus = document.createElement('button') ;
        minus.className = 'form-item-updown-button' ;
        minus.textContent = '-' ;
        minus.onclick = this.decrUpDown.bind(this, count) ;
    
        div.append(label) ;
        div.append(minus) ;
        div.append(count) ;
        div.append(plus) ;
        return div ;
    }
    
    formViewCreateItem(item) {
        let div ;
        if (item.type === 'text') {
            div = this.formViewCreateText(item) ;
        }
        else if (item.type === 'choice') {
            div = this.formViewCreateChoice(item) ;
        }
        else if (item.type === 'boolean') {
            div = this.formViewCreateBoolean(item) ;
        }
        else if (item.type === 'updown') {
            div = this.formViewCreateUpdown(item) ;
        }
        
        this.tags_.push(item.tag) ;
        return div ;
    }

    returnResultRecursively(elem, result) {
        if (elem.xerotag) {
            let one = {
                tag: elem.xerotag,
                type: elem.xerotype,
                value: elem.xerovalue
            } ;
            result.push(one) ;
        }
    
        for(let child of elem.childNodes) {
            this.returnResultRecursively(child, result) ;
        }
    }
    
    getValues() {
        //
        // Extract the results from the form and send to the main process
        //
        let result = [] ;
        this.returnResultRecursively(this.top_, result) ;
        return result ;
    }
    
    findElemByTag(elem, tag) {
        if (elem.xerotag === tag) {
            return elem ;
        }
    
        for(let child of elem.childNodes) {
            let answer = this.findElemByTag(child, tag)
            if (answer) {
                return answer ;
            }
        }
    
        return undefined ;
    }
    
    setXeroValue(elem, one) {
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
}