import * as React from 'react';
import './Container.scss';
import bemify from '../utils/bemify';
import Body from './Body';

const b = bemify('container');

export default class Container extends React.Component {
  render () {
    return (
      <div className={b()}>
        <div className={b('header')}>
          Plasma Wallet
        </div>
        <Body/>
      </div>
    );
  }
}