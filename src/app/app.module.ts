import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { ViewComponent } from './pages/view/view.component';
import { EditComponent } from './pages/edit/edit.component';
import { LearnComponent } from './pages/learn/learn.component';
import { QuizComponent } from './pages/quiz/quiz.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { NewComponent } from './pages/new/new.component';
import { NounFormComponent } from './forms/noun-form/noun-form.component';
import { AdjectiveFormComponent } from './forms/adjective-form/adjective-form.component';
import { GenericFormComponent } from './forms/generic-form/generic-form.component';
import { DefaultNewComponent } from './pages/new/default/default.component';
import { HttpClientModule } from '@angular/common/http';
import { VocabRepository } from './models/vocab.repository';
import { RestDataSource } from './models/rest.datasource';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GenericsViewComponent } from './pages/generics-view/generics-view.component';
import { GenericsStudyComponent } from './pages/generics-study/generics-study.component';
import { AudioABComponent } from './operations/audio-a-b/audio-a-b.component';
import { OperationDirective } from './directives/operation.directive';
import { AudioBAComponent } from './operations/audio-b-a/audio-b-a.component';
import { VocabComponent } from './pages/vocab/vocab.component';
import { EditorDirective } from './directives/editor.directive';
import { NounComponent } from './editors/noun/noun.component';
import { VerbComponent } from './editors/verb/verb.component';
import { OtherComponent } from './editors/other/other.component';
import { AdjectiveComponent } from './editors/adjective/adjective.component';
import { DefaultComponent } from './editors/default/default.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { StudyVocabComponent } from './pages/study-vocab/study-vocab.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ViewComponent,
    EditComponent,
    LearnComponent,
    QuizComponent,
    NotFoundComponent,
    NewComponent,
    NounFormComponent,
    GenericFormComponent,
    AdjectiveFormComponent,
    DefaultNewComponent,
    GenericsViewComponent,
    GenericsStudyComponent,
    AudioABComponent,
    OperationDirective,
    EditorDirective,
    AudioBAComponent,
    VocabComponent,
    NounComponent,
    VerbComponent,
    OtherComponent,
    AdjectiveComponent,
    DefaultComponent,
    PlaylistsComponent,
    StudyVocabComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    FontAwesomeModule
  ],
  providers: [
      VocabRepository,
      RestDataSource
  ],
  bootstrap: [AppComponent],
  entryComponents: [
      AudioABComponent,
      AudioBAComponent,
      NounComponent,
      AdjectiveComponent,
      VerbComponent,
      OtherComponent,
      DefaultComponent
  ]
})
export class AppModule { }
