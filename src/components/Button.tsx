import * as React from 'react';
import bemify from '../utils/bemify';
import c from 'classnames';
import './Button.scss';

const b = bemify('button');

export interface ButtonProps {
  classNames?: string
  onClick?: () => void
  small?: boolean
  children: React.ReactChild
  isLoading?: boolean
}

export default class Button extends React.Component<ButtonProps> {
  static defaultProps: {
    small: true,
    onClick: () => void,
    isLoading: false
  };

  render () {
    const names = c(b(), this.props.classNames, {
      [b(null, 'small')]: this.props.small,
      [b(null, 'loading')]: this.props.isLoading,
    });

    return (
      <button className={names} onClick={this.props.onClick} disabled={this.props.isLoading}>
        {this.props.isLoading ? <img src="/assets/loader.svg" /> : this.props.children}
      </button>
    );
  }
}