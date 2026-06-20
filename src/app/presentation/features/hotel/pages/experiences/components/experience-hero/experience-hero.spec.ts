import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperienceHeroComponent } from './experience-hero';

describe('ExperienceHeroComponent', () => {
  let component: ExperienceHeroComponent;
  let fixture: ComponentFixture<ExperienceHeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceHeroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExperienceHeroComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
