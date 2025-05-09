import { FormControl } from "../controls/formctrl";
import { EditDialog } from "./editdialog";

export interface FontData {
    family: string ;
    fullName: string ;
    postscriptName: string ;
    style: string ;
}

export abstract class EditFormControlDialog extends EditDialog {
    protected formctrl_ : FormControl ;
    protected font_name_? : HTMLSelectElement ;
    protected font_size_? : HTMLInputElement ;
    protected font_style_? : HTMLSelectElement ;
    protected font_weight_? : HTMLSelectElement ;
    protected text_color_? : HTMLInputElement ;
    protected background_color_? : HTMLInputElement ;
    protected transparent_? : HTMLInputElement ;
    protected tag_? : HTMLInputElement ;

    constructor(title: string, formctr: FormControl, closecb: (changed: boolean) => void) {
        super(title, closecb) ;
        this.formctrl_ = formctr ;
    }

    public okButton(event: Event) {
        this.extractData() ;                        // Extract the item data form the dialog
        this.formctrl_.updateFromItem() ;          // Make the control on the screen match the item data
        super.okButton(event) ;         // Finish the edit operation, save the form, and dismiss the dialog
    }

    protected abstract extractData() : void ;

    protected queryLocalFonts() : Promise<FontData[]> {
        return new Promise((resolve, reject) => {
            if('queryLocalFonts' in window.navigator) {
                (window.navigator.queryLocalFonts as () => Promise<FontData[]>)().then((fonts: FontData[]) => {
                    resolve(fonts) ;
                }).catch((err: Error) => {
                    console.error('Error querying local fonts:', err) ;
                    reject(err) ;
                }) ;
            } else {
                resolve([]) ; // No local fonts available
            }
        }) ;
    }

    protected async populateFontSelector(div: HTMLElement) {
        let label : HTMLLabelElement ;
        let option: HTMLOptionElement ;

        this.font_name_ = document.createElement('select') ;
        this.font_name_.className = 'popup-form-edit-dialog-select' ;
        let fonts = await this.queryLocalFonts() ;
        for(let font of fonts) {
            option = document.createElement('option') ;
            option.value = font.fullName ;
            option.innerText = font.fullName ;
            this.font_name_.appendChild(option) ;
        }
        this.font_name_.value = this.formctrl_.item.fontFamily ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font' ;
        label.appendChild(this.font_name_) ;
        div.appendChild(label) ;       
        
        this.font_size_ = document.createElement('input') ;
        this.font_size_.type = 'number' ;
        this.font_size_.max = '48' ;
        this.font_size_.min = '8' ;
        this.font_size_.className = 'popup-form-edit-dialog-input' ;
        this.font_size_.value = this.formctrl_.item.fontSize.toString() ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Size' ;
        label.appendChild(this.font_size_) ;
        div.appendChild(label) ;          

        this.font_style_ = document.createElement('select') ;
        this.font_style_.className = 'popup-form-edit-dialog-select' ;
        option = document.createElement('option') ;
        option.value = 'normal' ;
        option.innerText = 'Normal' ;
        this.font_style_.appendChild(option) ;
        option = document.createElement('option') ;
        option.value = 'italic' ;
        option.innerText = 'Italic' ;
        this.font_style_.appendChild(option) ;
        this.font_style_.value = this.formctrl_.item.fontStyle ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Style' ;
        label.appendChild(this.font_style_) ;
        div.appendChild(label) ;       
        
        this.font_weight_ = document.createElement('select') ;
        this.font_weight_.className = 'popup-form-edit-dialog-select' ;
        option = document.createElement('option') ;
        option.value = 'normal' ;
        option.innerText = 'Normal' ;
        this.font_weight_.appendChild(option) ;
        option = document.createElement('option') ;
        option.value = 'bold' ;
        option.innerText = 'Boldl' ;
        this.font_weight_.appendChild(option) ;
        option = document.createElement('option') ;
        option.value = 'bolder' ;
        option.innerText = 'Bolder' ;
        this.font_weight_.appendChild(option) ;
        option = document.createElement('option') ;
        option.value = 'lighter' ;
        option.innerText = 'Lighter' ;
        this.font_weight_.appendChild(option) ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Weight' ;
        label.appendChild(this.font_weight_) ;
        div.appendChild(label) ;           
    }

    protected populateColors(div: HTMLElement) {
        let label: HTMLLabelElement ;

        this.text_color_ = document.createElement('input') ;
        this.text_color_.type = 'color' ;
        this.text_color_.value = this.formctrl_.item.color ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Foreground Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;    

        this.background_color_ = document.createElement('input') ;
        this.background_color_.type = 'color' ;
        this.background_color_.value = this.formctrl_.item.background ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Background Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;

        this.transparent_ = document.createElement('input') ;
        this.transparent_.type = 'checkbox' ;
        this.transparent_.checked = this.formctrl_.item.transparent ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Background Transparent' ;
        label.appendChild(this.transparent_) ;
        div.appendChild(label) ;
    }

    protected populateTag(div:  HTMLElement) {
        let label: HTMLLabelElement ;

        this.tag_ = document.createElement('input') ;
        this.tag_.type = 'text' ;
        this.tag_.className = 'popup-form-edit-dialog-input' ;
        this.tag_.value = this.formctrl_.item.tag ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Tag' ;
        label.appendChild(this.tag_) ;
        div.appendChild(label) ;
    }
}
