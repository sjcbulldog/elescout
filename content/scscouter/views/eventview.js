
class EventView extends TextView {
    constructor(div, viewtype, args) {
        super(div,viewtype,args[1] + '<br>' + args[2]) ;
    }
}
