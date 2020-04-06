import { Component, OnInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { OperationDirective } from 'src/app/directives/operation.directive';
import { AudioABComponent } from 'src/app/operations/audio-a-b/audio-a-b.component';
import { AudioBAComponent } from 'src/app/operations/audio-b-a/audio-b-a.component';

@Component({
    selector: 'app-generics-study',
    templateUrl: './generics-study.component.html',
    styleUrls: ['./generics-study.component.scss']
})
export class GenericsStudyComponent implements OnInit {

    operationSelected: string;

    @ViewChild(OperationDirective, {static: true}) opHost: OperationDirective;

    constructor(private componentFactoryResolver: ComponentFactoryResolver) {

    }

    ngOnInit() {
        this.operationSelected = 'AudioABComponent';
    }

    loadSelectedOperation() {
        this.loadComponent(this.operationSelected);

    }

    loadComponent(componentName: string) {
        // temporary(?)
        let component;
        if ( componentName == 'AudioABComponent') {
            component = AudioABComponent;
        } else {
            component = AudioBAComponent;
        }
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
        const viewContainerRef = this.opHost.viewContainerRef;
        viewContainerRef.clear();

        const componentRef = viewContainerRef.createComponent(componentFactory);
    }

}
