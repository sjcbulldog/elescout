
export class Team {
    public key_: string ;
    public number_ : number ;
    public name_: string ;
    public nickname_: string ;
    public city_: string ;
    public state_prov_: string ;
    public country_: string ;
    public school_name_: string ;
    public address_: string ;
    public post_code_ : string ;
    public locname_ : string ;
    public lng_: number ;
    public lat_: number ;

    public constructor(key: string, num: number, name: string, nickname: string, city: string, state_prov: string, 
                country: string, schoolname: string, address: string, postcode: string, locname: string, lng: number, lat: number) {
        this.key_ = key ;
        this.number_ = num ;
        this.name_ = name ;
        this.nickname_ = nickname ;
        this.city_ = city ;
        this.state_prov_ = state_prov ;
        this.country_ = country ;
        this.school_name_ = schoolname ;
        this.address_ = address ;
        this.post_code_ = postcode ;
        this.locname_ = locname ;
        this.lng_ = lng ;
        this.lat_ = lat;
    }
}