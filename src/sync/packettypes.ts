export const PacketCompressionNone = 0 ;

export const PacketTypeHello = 0x00 ;
export const PacketTypeRequestTablets = 0x01 ;
export const PacketTypeError = 0x02 ;
export const PacketTypeProvideTablets = 0x03 ;
export const PacketTypeRequestMatchList = 0x04 ;
export const PacketTypeRequestTeamList = 0x05 ;

export const PacketNameMap : string[] = [
    'PacketTypeHello',
    'PacketTypeRequestTablets',
    'PacketTypeError',
    'PacketTypeProvideTablets',
];
