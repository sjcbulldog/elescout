class PopupMenuItem {
    constructor(name, action, submenu) {
        this.name = name;
        this.action = action;
        this.submenu = submenu;
    }
}

class PopupMenu {
    constructor(items) {
        this.items_ = items ;
        this.top_ = document.createElement('div') ;
        this.top_.className = 'popup-menu' ;
        this.child_menu_ = undefined ;
    }

    onClick(item, event) {
        if (item.action) {
            item.action() ;
        }
    }

    onSubmenuClick(item, event) {
        if (item.submenu) {
            this.child_menu_ = item.submenu ;
            this.child_menu_.showRelative(this.parent_, event.clientX, event.clientY) ;
        }
    }

    onGlobalClick(event) {
        let item = event.target.mitem ;
        if (item && !item.submenu) {
            this.closeMenu() ;
        }
    }

    onGlobalKey(event) {
        if (event.key === 'Escape') {
            this.closeMenu() ;
        }
    }

    closeMenu() {
        if (this.child_menu_) {
            this.child_menu_.closeMenu() ;
            this.child_menu_ = undefined ;
        }

        if (this.popup_ && this.parent_.contains(this.popup_)) {
            this.parent_.removeChild(this.popup_) ;
            this.popup_ = null ;
        }
        document.removeEventListener('click', this.onGlobalClick.bind(this)) ;
        document.removeEventListener('keydown', this.onGlobalKey.bind(this)) ;
    }

    showRelative(win, x, y) {
        this.parent_ = win ;
        this.popup_ = document.createElement('div') ;
        this.popup_.className = 'popup-menu' ;
        this.popup_.style.left = x + 'px' ;
        this.popup_.style.top = y + 'px' ;
        this.popup_.style.zIndex = 1000 ;

        for(let item of this.items_) {
            let div = document.createElement('div') ;
            div.className = 'popup-menu-item' ;

            div.mitem = item ;
            if (item.submenu) {
                div.onclick = this.onSubmenuClick.bind(this, item) ;
                div.innerHTML += item.name + '&nbsp;&nbsp;&nbsp;&nbsp;&#x27A4;' ;
            } else {
                div.innerText = item.name ;
                div.onclick = this.onClick.bind(this, item) ;
            }
            this.popup_.appendChild(div) ;
        }

        document.addEventListener('click', this.onGlobalClick.bind(this)) ;
        document.addEventListener('keydown', this.onGlobalKey.bind(this)) ;
        this.parent_.appendChild(this.popup_) ; 
    }
}
