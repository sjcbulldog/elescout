
export class FRCEvent {
    public evkey: string ;
    public desc: string ;
    public city?: string ; 
    public country?: string ; 
    public district?: string ; 
    public end_date?: string ; 
    public event_code?: string ; 
    public event_type?: string ; 
    public start_date?: string ; 
    public state_prov?: string ; 
    public year?: number ;

    public constructor(key: string, desc: string) {
        this.evkey = key ;
        this.desc = desc ;
    }
}