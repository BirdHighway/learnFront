import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EditComponent } from './pages/edit/edit.component';
import { ViewComponent } from './pages/view/view.component';
import { LearnComponent } from './pages/learn/learn.component';
import { QuizComponent } from './pages/quiz/quiz.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { NewComponent } from './pages/new/new.component';
import { NounFormComponent } from './forms/noun-form/noun-form.component';
import { AdjectiveFormComponent } from './forms/adjective-form/adjective-form.component';
import { DefaultNewComponent } from './pages/new/default/default.component';
import { VocabComponent } from './pages/vocab/vocab.component';
import { PlaylistsComponent } from './pages/playlists/playlists.component';
import { StudyVocabComponent } from './pages/study-vocab/study-vocab.component';
import { VerbSetsComponent } from './pages/verb-sets/verb-sets.component';
import { VerbSetsSingleComponent } from './pages/verb-sets-single/verb-sets-single.component';
import { StudyVerbsComponent } from './pages/study-verbs/study-verbs.component';
import { ImagesComponent } from './pages/images/images.component';
import { VerbDrillComponent } from './pages/verb-drill/verb-drill.component';


const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'view', component: ViewComponent },
    { path: 'new', component: NewComponent,
        children: [
            { path: '', component: DefaultNewComponent },
            { path: 'noun', component: NounFormComponent },
            { path: 'adjective', component: AdjectiveFormComponent }
        ]
    },
    { path: 'edit', component: EditComponent },
    { path: 'edit/:id', component: EditComponent },
    { path: 'learn', component: LearnComponent },
    { path: 'quiz', component: QuizComponent },
    { path: 'vocab', component: VocabComponent },
    { path: 'playlists', component: PlaylistsComponent },
    { path: 'study-vocab', component: StudyVocabComponent },
    { path: 'verb-sets', component: VerbSetsComponent },
    { path: 'verb-set/:id', component: VerbSetsSingleComponent },
    { path: 'verb-study', component: StudyVerbsComponent },
    { path: 'verb-drills', component: VerbDrillComponent },
    { path: 'images', component: ImagesComponent },
    { path: 'not-found', component: NotFoundComponent }, 
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', component: NotFoundComponent } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
