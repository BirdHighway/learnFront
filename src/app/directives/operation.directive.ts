import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[op-host]'
})

export class OperationDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}