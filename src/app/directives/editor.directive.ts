import { Directive, ViewContainerRef, Output, EventEmitter } from '@angular/core';

@Directive({
    selector: '[editor-host]'
})

export class EditorDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}