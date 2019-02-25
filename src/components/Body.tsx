import * as React from 'react';
import {ChangeEvent} from 'react';
import * as ReactModal from 'react-modal';
import Plasma from 'kyokan-plasma-client/lib/Plasma';
import bemify from '../utils/bemify';
import {RESTRootClient} from 'kyokan-plasma-client/lib/rpc/RESTRootClient';
import './Body.scss';
import Button from './Button';
import Web3 = require('web3');
import BN = require('bn.js');

const b = bemify('body');

ReactModal.defaultStyles.overlay = {
  ...ReactModal.defaultStyles.overlay,
  backgroundColor: 'rgba(99,115,128, 0.20)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

ReactModal.defaultStyles.content = {
  ...ReactModal.defaultStyles.content,
  backgroundColor: 'white',
  border: '1px solid #d6d9dd',
  position: 'static',
  width: '400px',
};

export interface Ethereum {
  enable (): Promise<void>
}

let w3: Web3;
let account: string;
let ethereum: Ethereum;
let plasma: Plasma;

export interface BodyState {
  plasmaBalance: BN
  chainBalance: BN
  isShowingDepositModal: boolean
  isShowingSendModal: boolean
  isShowingExitModal: boolean
  isDepositing: boolean
  isSending: boolean
  isExiting: boolean
  depositAmount: string
  sendAmount: string
  exitAmount: string
  to: string
}

export default class Body extends React.Component<{}, BodyState> {
  constructor (props: {}) {
    super(props);

    this.state = {
      plasmaBalance: new BN(0),
      chainBalance: new BN(0),
      isShowingDepositModal: false,
      isShowingSendModal: false,
      isShowingExitModal: false,
      isDepositing: false,
      isSending: false,
      isExiting: false,
      depositAmount: '',
      sendAmount: '',
      exitAmount: '',
      to: '',
    };
  }

  async componentDidMount () {
    ReactModal.setAppElement('#root');

    if ('ethereum' in window) {
      w3 = new Web3((window as any).ethereum);
      ethereum = (window as any).ethereum as Ethereum;
      try {
        await ethereum.enable();
      } catch (e) {
        console.error('oh now');
        return;
      }

      const accounts = await w3.eth.getAccounts();
      account = accounts[0];

      plasma = new Plasma({
        web3: w3,
        contractAddress: '0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da',
        rootClient: new RESTRootClient((process.env as any).PLASMA_URL),
        fromAddress: account,
      });
      await this.refreshBalances();
    } else {
    }
  }

  showDepositModal = () => {
    this.setState({
      isShowingDepositModal: true,
    });
  };

  hideDepositModal = () => {
    this.setState({
      isShowingDepositModal: false,
    });
  };

  showSendModal = () => {
    this.setState({
      isShowingSendModal: true,
    });
  };

  hideSendModal = () => {
    this.setState({
      isShowingSendModal: false,
    });
  };

  showExitModal = () => {
    this.setState({
      isShowingExitModal: true,
    });
  };

  hideExitModal = () => {
    this.setState({
      isShowingExitModal: false,
    });
  };

  refreshBalances = async () => {
    const plasmaBalance = await plasma.rootNode().getBalance(account);
    const chainBalance = await w3.eth.getBalance(account);
    this.setState({
      plasmaBalance: plasmaBalance,
      chainBalance: new BN(chainBalance),
    });
  };

  onClickDeposit = async () => {
    try {
      this.setState({
        isDepositing: true,
      });
      const amount = Web3.utils.toWei(this.state.depositAmount, 'ether');
      const res = await plasma.deposit(amount);
      await plasma.send(account, amount, new BN(0), res.nonce);
      await this.refreshBalances();
      this.setState({
        isShowingDepositModal: false,
        depositAmount: '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.setState({
        isDepositing: false,
      });
    }
  };

  onClickSend = async () => {
    try {
      this.setState({
        isSending: true,
      });

      const to = this.state.to;
      const amount = Web3.utils.toWei(this.state.sendAmount, 'ether');
      await plasma.send(to, amount, new BN(0));
      await this.refreshBalances();
      this.setState({
        isShowingSendModal: false,
        sendAmount: '',
        to: '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.setState({
        isSending: false,
      });
    }
  };

  onClickExit = async () => {
    try {
      this.setState({
        isExiting: true,
      });

      const amount = Web3.utils.toWei(this.state.exitAmount, 'ether');
      await plasma.startExit(amount, new BN(amount).add(new BN('1000000000')));
      await new Promise((resolve) => setTimeout(resolve, 15000));
      await this.refreshBalances();
      this.setState({
        isShowingExitModal: false,
        exitAmount: '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.setState({
        isExiting: false,
      });
    }
  };

  render () {
    return (
      <div className={b()}>
        <div className={b('balances')}>
          <div className={b('balance')}>
            {Web3.utils.fromWei(this.state.plasmaBalance, 'ether')} ETH
            <div className={b('balance-label')}>
              Plasma Balance
            </div>
          </div>
          <div className={b('balance')}>
            {Web3.utils.fromWei(this.state.chainBalance, 'ether')} ETH
            <div className={b('balance-label')}>
              On-Chain Balance
            </div>
          </div>
        </div>
        <div className={b('buttons')}>
          <Button onClick={this.showDepositModal}>
            Deposit
          </Button>
          <Button onClick={this.showSendModal}>
            Send
          </Button>
          <Button onClick={this.showExitModal}>
            Exit
          </Button>
        </div>
        {this.renderDepositModal()}
        {this.renderSendModal()}
        {this.renderExitModal()}
      </div>
    );
  }

  renderDepositModal () {
    return (
      <ReactModal
        isOpen={this.state.isShowingDepositModal}
        onRequestClose={this.hideDepositModal}
      >
        <div className={b('modal-header')}>
          Deposit
        </div>
        <div className={b('modal-input')}>
          <label htmlFor="amount">
            Amount (ETH):
          </label>
          <input
            type="number"
            name="amount"
            autoFocus
            value={this.state.depositAmount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => this.setState({
              depositAmount: e.target.value,
            })}
          />
        </div>
        <Button small onClick={this.onClickDeposit} isLoading={this.state.isDepositing}>
          Deposit Funds
        </Button>
      </ReactModal>
    );
  }

  renderSendModal () {
    return (
      <ReactModal
        isOpen={this.state.isShowingSendModal}
        onRequestClose={this.hideSendModal}
      >
        <div className={b('modal-header')}>
          Send
        </div>
        <div className={b('modal-input')}>
          <label htmlFor="amount">
            Amount (ETH):
          </label>
          <input
            type="number"
            name="amount"
            autoFocus
            placeholder="0.123..."
            value={this.state.sendAmount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              this.setState({
                sendAmount: e.target.value,
              });
            }}
          />
        </div>
        <div className={b('modal-input')}>
          <label htmlFor="to">
            To:
          </label>
          <input
            type="text"
            name="to"
            autoFocus
            placeholder="0xabcd123..."
            value={this.state.to}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              this.setState({
                to: e.target.value,
              });
            }}
          />
        </div>
        <Button small onClick={this.onClickSend} isLoading={this.state.isSending}>
          Send Funds
        </Button>
      </ReactModal>
    );
  }

  renderExitModal () {
    return (
      <ReactModal
        isOpen={this.state.isShowingExitModal}
        onRequestClose={this.hideExitModal}
      >
        <div className={b('modal-header')}>
          Exit
        </div>
        <div className={b('modal-input')}>
          <label htmlFor="amount">
            Amount (ETH):
          </label>
          <input
            type="number"
            name="amount"
            autoFocus
            value={this.state.exitAmount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => this.setState({
              exitAmount: e.target.value,
            })}
          />
        </div>
        <Button small onClick={this.onClickExit} isLoading={this.state.isExiting}>
          Exit
        </Button>
      </ReactModal>
    );
  }
}