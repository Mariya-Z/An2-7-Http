import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// rxjs
import { Observable, Subscription } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { AutoUnsubscribe, DialogService, CanComponentDeactivate } from './../../../core';
import { UserModel } from './../../models/user.model';
import { UserObservableService } from './../../services';
import { Location } from '@angular/common';

@Component({
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
})
@AutoUnsubscribe()
export class UserFormComponent
  implements OnInit, CanComponentDeactivate {
  user: UserModel;
  originalUser: UserModel;
  private sub: Subscription;

  constructor(
    private userObservableService: UserObservableService,
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    // data is an observable object
    // which contains custom and resolve data
    this.route.data.pipe(pluck('user')).subscribe((user: UserModel) => {
      this.user = { ...user };
      this.originalUser = { ...user };
    });
  }

  onSaveUser() {
    const user = { ...this.user };

    const method = user.id ? 'updateUser' : 'createUser';
    this.sub = this.userObservableService[method](user)
      .subscribe(
        savedUser => {
          this.originalUser = { ...savedUser };
          user.id
            // optional parameter: http://localhost:4200/users;editedUserID=2
            ? this.router.navigate(['users', { editedUserID: user.id }])
            : this.onGoBack();
        },
        error => console.log(error)
      );

  }

  onGoBack() {
    this.location.back();
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    const flags = Object.keys(this.originalUser).map(key => {
      if (this.originalUser[key] === this.user[key]) {
        return true;
      }
      return false;
    });

    if (flags.every(el => el)) {
      return true;
    }

    // Otherwise ask the user with the dialog service and return its
    // promise which resolves to true or false when the user decides
    return this.dialogService.confirm('Discard changes?');
  }
}
