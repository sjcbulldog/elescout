import { StringLiteralLike } from "typescript"

export interface FormImage {
    name: string,
    data: string,
    topleft: {
        x: number,
        y: number
    },
    bottomright: {
        x: number,
        y: number
    },
    fieldsize: {
        width: number,
        height: number
    },
    units: string      
};

export interface FormDetailInfo {
    title: string,
    type: string,
    json: any,
    images? : FormImage[],
}

export interface FormInfo
{
    message: string | undefined ;
    form: FormDetailInfo | undefined ;
    reversed: boolean | undefined ;
    color: string | undefined ;
}
