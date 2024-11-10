export const PacketCompressionNone = 0 ;

export enum PacketType {
    Hello = 0x00,
    RequestTablets = 0x01,
    Error = 0x02,
    ProvideTablets = 0x03,
    RequestMatchList = 0x04,
    RequestTeamList = 0x05,
    RequestTeamForm = 0x06,
    RequestMatchForm = 0x07,
    ProvideTeamForm = 0x08,
    ProvideMatchForm = 0x09,
    ProvideMatchList = 0x0a,
    ProvideTeamList = 0x0b,
    ProvideResults = 0x0c,
    ReceivedResults = 0x0d,
    Goodbye = 0x0e
} ;

export const PacketNameMap : string[] = [
    'PacketType.Hello',
    'PacketType.RequestTablets',
    'PacketType.Error',
    'PacketType.ProvideTablets',
    'PacketType.RequestMatchList',
    'PacketType.RequestTeamList',
    'PacketType.RequestTeamForm',
    'PacketType.RequestMatchForm',
    'PacketType.ProvideTeamForm',
    'PacketType.ProvideMatchForm',
    'PacketType.ProvideMatchList',
    'PacketType.ProvideTeamList',
    'PacketType.ProvideResults',
    'PacketType.ReceivedResults',
    'PacketType.Goodbye'
];
