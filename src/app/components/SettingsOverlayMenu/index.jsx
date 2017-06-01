import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import cookies from 'js-cookie';

import titleCase from 'lib/titleCase';
import { urlWith } from 'lib/urlWith';
import OverlayMenu from 'app/components/OverlayMenu';
import { LinkRow, ButtonRow, ExpandoRow } from 'app/components/OverlayMenu/OverlayMenuRow';
import menuItems from './SettingsOverlayMenuItems';
import { COLOR_SCHEME } from 'app/constants';
import { userAccountSelector } from 'app/selectors/userAccount';
import { showXPromoOptOutMenuLink } from 'app/selectors/xpromo';
import config from 'config';

const { NIGHTMODE } = COLOR_SCHEME;

const DESKTOP_TRACKING_PARAMS = {
  utm_source: 'mweb_navbar',
  utm_medium: '2X',
  utm_name: 'desktop_link',
};

const DESKTOP_REDIRECT_EXPIRY = 365;

const userIconClassName = 'icon-user-account icon-large blue';


export const menuItemUrl = item => {
  const url = item.url;
  if (url.indexOf('/help') !== -1 || url.indexOf('/wiki') !== -1) {
    return { href: item.url };
  }

  return {
    href: `${config.reddit}${item.url}`,
    noRoute: true,
  };
};

export const renderLoginRow = () => (
  <LinkRow
    text='Log in / sign up'
    icon={ userIconClassName }
    href={ '/login' }
  />
);

const xpromoOptOutLink = () => (
  <LinkRow
    key='xpromo-off'
    text='Ask To Open In App (On)'
    icon='icon-linkout icon-large blue'
    href={ '/?no_xpromo_interstitial_menu=true' }
  />
);

export const renderLoggedInUserRows = (user) => {
  const { inboxCount } = user;
  let badge;

  if (inboxCount) {
    badge = (
      <span className='badge badge-orangered badge-with-spacing'>
        { inboxCount }
      </span>
    );
  }

  return [
    <LinkRow
      key='account'
      text={ user.name }
      href={ `/user/${user.name}` }
      icon={ userIconClassName }
    >
      <form className='OverlayMenu-row-right-item' action='/logout' method='POST'>
        <button type='submit'>
          Log out
        </button>
      </form>
    </LinkRow>,

    <LinkRow
      key='inbox'
      text={ ['Inbox', badge] }
      href='/message/messages'
      icon={ `icon-message icon-large ${inboxCount ? 'orangered' : 'blue'}` }
    />,

    <LinkRow
      key='saved'
      text='Saved'
      href={ `/user/${user.name}/saved` }
      icon='icon-save icon-large lime'
    />,

    <LinkRow
      key='settings'
      text= 'Settings'
      noRoute={ true }
      href={ 'https://www.reddit.com/prefs' }
      icon='icon-settings icon-large blue'
    />,
  ];
};

export const SettingsOverlayMenu = (props) => {
  const { compact, theme, pageData, user, optOut } = props;
  const { url, queryParams } = pageData;
  const desktopRedirectParams = { ...queryParams, ...DESKTOP_TRACKING_PARAMS };

  return (
    <OverlayMenu>
      {
        user ? renderLoggedInUserRows(user) : renderLoginRow()
      }
      <ButtonRow
        key='compact-toggle'
        action='/actions/overlay-compact-toggle'
        icon='icon-compact icon-large blue'
        text={ `${compact ? 'Card' : 'Compact'} view` }
      />
      <ButtonRow
        key='theme-toggle'
        action='/actions/overlay-theme-toggle'
        icon={ 'icon-spaceship icon-large  blue' }
        text={ `${theme === NIGHTMODE ? 'Day' : 'Night'} Theme` }
      />
      <LinkRow
        key='goto-desktop'
        text='Desktop Site'
        icon='icon-desktop icon-large blue'
        noRoute={ true }
        href={ config.reddit + urlWith(url, desktopRedirectParams) }
        onClick={ props.onGoToDesktop }
      />
      {
        optOut ? xpromoOptOutLink() : null
      }
      <ExpandoRow
        key='about-reddit'
        icon='icon-info icon-large'
        text='About Reddit'
      >
        { menuItems.aboutItems.map((item) => {
          return (
            <LinkRow
              { ...menuItemUrl(item) }
              key = { item.url }
              text={ titleCase(item.title) }
            />);
        }) }
      </ExpandoRow>
      <ExpandoRow
        key='reddit-rules'
        icon='icon-rules icon-large'
        text='Reddit Rules'
      >
        { menuItems.ruleItems.map((item) => {
          return (
            <LinkRow
              { ...menuItemUrl(item) }
              key={ item.url }
              text={ titleCase(item.title) }
            />);
        }) }
      </ExpandoRow>
    </OverlayMenu>
  );
};


const mapStateToProps = createSelector(
  state => state.compact,
  state => state.theme,
  state => state.platform.currentPage,
  showXPromoOptOutMenuLink,
  userAccountSelector,
  (compact, theme, pageData, optOut, user) => ({ compact, theme, pageData, optOut, user }),
);

const mergeProps = stateProps => ({
  ...stateProps,
  onGoToDesktop: () => {
    // this cookie is telling our CDN, "when you see the www url, do NOT
    // direct user to the mweb experience"
    cookies.set('mweb-no-redirect', '1', {
      domain: config.rootReddit,
      expires: DESKTOP_REDIRECT_EXPIRY,
    });
  },
});

export default connect(mapStateToProps, null, mergeProps)(SettingsOverlayMenu);
