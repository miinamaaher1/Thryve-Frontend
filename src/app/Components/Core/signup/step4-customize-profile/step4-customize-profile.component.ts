import { Component, EventEmitter, Output } from '@angular/core';
import { SignupService } from '../signup.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step4-customize-profile',
  imports:[FormsModule, CommonModule],
  templateUrl: './step4-customize-profile.component.html',
  styleUrls: ['./step4-customize-profile.component.css']
})
export class Step4CustomizeProfileComponent {
  @Output() prev = new EventEmitter<void>();
  @Output() complete = new EventEmitter<{ profilePic?: File, coverPic?: File }>();

  profilePicUrl: string | null = null;
  coverPicUrl: string | null = null;
  profilePicFile?: File;
  coverPicFile?: File;

  constructor(public signupService: SignupService) {}

  onProfilePicSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profilePicFile = file;
      this.profilePicUrl = URL.createObjectURL(file);
    }
  }

  onCoverPicSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.coverPicFile = file;
      this.coverPicUrl = URL.createObjectURL(file);
    }
  }

  completeSignup() {
    this.complete.emit({
      profilePic: this.profilePicFile,
      coverPic: this.coverPicFile
    });
  }
}

