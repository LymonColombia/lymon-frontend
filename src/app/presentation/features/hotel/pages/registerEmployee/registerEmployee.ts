import { Component } from '@angular/core';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';

@Component({
  selector: 'app-register-employee',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './registerEmployee.html',
  styleUrls: ['./registerEmployee.css']
})
export class RegisterEmployeeComponent {
  
}
