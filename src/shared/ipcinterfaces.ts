export interface IPCSetView {
    view: string;
    args: any[];
}

export interface IPCSetStatus {
    left: string;
    middle: string;
    right: string;
}

export interface IPCTabletDefn {
    name: string ;
    purpose: string | undefined;
}

type IPCFormControlType = 'label' | 'text' | 'boolean' | 'updown' | 'choice' | 'select' ;

export interface IPCFormItem {
    type: IPCFormControlType ;
    tag: string ;
    x: number ;
    y: number ;
    width: number ;
    height: number ;
    fontFamily: string ;
    fontSize: number ;
    fontStyle: string ;
    fontWeight: string ;
    color: string ;
    background: string ;
    transparent: boolean ;
    datatype: string ;
}

export interface IPCLabelItem extends IPCFormItem {
    text: string ;
}

export interface IPCTextItem extends IPCFormItem {
    placeholder: string ;
}

export interface IPCBooleanItem extends IPCFormItem {
}

export interface IPCUpDownItem extends IPCFormItem {
    minvalue: number ;
    maxvalue: number ;
}

export interface IPCChoice {
    text: string ;
    value: number | string ;
}

export interface IPCChoicesItem extends IPCFormItem {
    choices: IPCChoice[] ;
}

export type IPCMultipleChoiceOrientation = 'horizontal' | 'vertical' ;

export interface IPCMultipleChoiceItem extends IPCChoicesItem {
    radiosize: number ;
    orientation: IPCMultipleChoiceOrientation
}

export interface IPCSelectItem extends IPCChoicesItem {
}

export interface IPCSection {
    name: string ;
    image: string ;
    items: IPCFormItem[] ;
}

export interface IPCForm {
    purpose: string | undefined ;
    sections: IPCSection[] ;
    images: string[] ;
}
