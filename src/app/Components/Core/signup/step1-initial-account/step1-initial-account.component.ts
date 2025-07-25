import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SignupService } from '../signup.service';
import { SignupData } from '../signup.component';

@Component({
  selector: 'app-step1-initial-account',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './step1-initial-account.component.html',
  styleUrls: ['./step1-initial-account.component.css']
})
export class Step1InitialAccountComponent {
  @Output() next = new EventEmitter<SignupData>();

  email: string = '';
  password: string = '';
  passwordVisible = false;
  strengthClass = '';
  barWidth = '0%';

  constructor(public signupService: SignupService) {}

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onPasswordInput(password: string) {
    const strength = this.calculateStrength(password);
    this.barWidth = strength.width;
    this.strengthClass = strength.color;
  }

  calculateStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()]/.test(password)) score++;
    
    if (score >= 3) return { width: '100%', color: 'bg-green-400' };
    if (score === 2) return { width: '66%', color: 'bg-yellow-400' };
    if (score === 1) return { width: '33%', color: 'bg-red-400' };
    
    return { width: '0%', color: '' };
  }

  proceed() {
    if (this.email && this.password) {
      console.log("Proceeding to next step...");
      this.next.emit({
        email: this.email,
        password: this.password
      });
    }
  }
}
