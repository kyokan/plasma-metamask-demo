import * as ReactDOM from 'react-dom';
import * as React from 'react';
import Container from './components/Container';
import './index.scss';

const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);
ReactDOM.render(<Container />, root);