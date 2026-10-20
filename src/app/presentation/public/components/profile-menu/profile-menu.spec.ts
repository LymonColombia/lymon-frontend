import { TestBed } from '@angular/core/testing';
import { ProfileMenuComponent } from './profile-menu';

describe('ProfileMenuComponent', () => {
  function create(email: string | null) {
    const fixture = TestBed.createComponent(ProfileMenuComponent);
    fixture.componentRef.setInput('email', email);
    return fixture.componentInstance;
  }

  it('derives initials and label from the email local part', () => {
    const menu = create('  john.doe@mail.com ');
    expect(menu.initials()).toBe('JO');
    expect(menu.profileLabel()).toBe('john.doe');
  });

  it('falls back when there is no usable email', () => {
    expect(create(null).initials()).toBe('?');
    expect(create(null).profileLabel()).toBe('Guest');
    expect(create('@mail.com').initials()).toBe('?');
    expect(create('@mail.com').profileLabel()).toBe('@mail.com');
  });

  it('closes the dropdown when an action is chosen', () => {
    const menu = create('a@b.co');
    const logout = vi.fn();
    menu.logoutClicked.subscribe(logout);

    menu.toggleDropdown();
    expect(menu.isDropdownOpen()).toBe(true);
    menu.onLogout();
    expect(menu.isDropdownOpen()).toBe(false);
    expect(logout).toHaveBeenCalled();
  });
});
