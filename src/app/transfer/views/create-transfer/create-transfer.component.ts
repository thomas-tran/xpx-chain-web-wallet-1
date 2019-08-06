import { Component, OnInit } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl
} from "@angular/forms";
import { MosaicId, SignedTransaction, Address, UInt64 } from "tsjs-xpx-chain-sdk";
import { MosaicService, MosaicsStorage } from "../../../servicesModule/services/mosaic.service";
import { ProximaxProvider } from "../../../shared/services/proximax.provider";
import { DataBridgeService } from "../../../shared/services/data-bridge.service";
import { WalletService } from '../../../wallet/services/wallet.service';
import { SharedService, ConfigurationForm } from '../../../shared/services/shared.service';
import { TransactionsService, TransferInterface } from '../../services/transactions.service';
import { environment } from '../../../../environments/environment';
import { ServicesModuleService } from '../../../servicesModule/services/services-module.service';

@Component({
  selector: "app-create-transfer",
  templateUrl: "./create-transfer.component.html",
  styleUrls: ["./create-transfer.component.css"]
})
export class CreateTransferComponent implements OnInit {

  allMosaics = [];
  amountXpxToSend = '0.000000';
  balanceXpx = '0.000000';
  configurationForm: ConfigurationForm;
  errorOtherMosaics: boolean = false;
  formTransfer: FormGroup;
  blockSendButton = false;
  invalidRecipient = false;
  insufficientBalance = false;
  msgErrorUnsupported = '';
  msgErrorUnsupportedContact = '';
  mosaicXpx: { id: string, name: string; divisibility: number } = null;
  listContacts: any = [];
  otherMosaics = [];
  optionOtherMosaics
  incrementMosaics = 0;
  selectOtherMosaics = [];
  showContacts = false;
  subscribe = ['accountInfo', 'transactionStatus'];
  title = 'Make a transfer';
  transactionSigned: SignedTransaction = null;
  currentBlock: number = 0;


  constructor(
    private dataBridge: DataBridgeService,
    private fb: FormBuilder,
    private mosaicServices: MosaicService,
    private proximaxProvider: ProximaxProvider,
    private serviceModuleService: ServicesModuleService,
    private sharedService: SharedService,
    private transactionService: TransactionsService,
    private walletService: WalletService
  ) { }

  ngOnInit() {
    this.configurationForm = this.sharedService.configurationForm;
    this.mosaicXpx = {
      id: environment.mosaicXpxInfo.id,
      name: environment.mosaicXpxInfo.name,
      divisibility: environment.mosaicXpxInfo.divisibility
    };

    this.selectOtherMosaics = [{
      value: "0",
      label: "Select mosaic",
      selected: true,
      disabled: true
    }];

    this.ngOnDestroy();
    this.booksAddress();
    this.createFormTransfer();
    this.getMosaics();
    this.subscribeValue();
  }

  ngOnDestroy(): void {
    this.subscribe.forEach(element => {
      if (this.subscribe[element] !== undefined) {
        this.subscribe[element].unsubscribe();
      }
    });
  }


  /**
   *
   *
   * @memberof CreateTransferComponent
   */
  async getMosaics() {
    this.subscribe['accountInfo'] = this.walletService.getAccountInfoAsync().subscribe(
      async accountInfo => {
        const mosaicsSelect: any = [];
        if (accountInfo !== undefined && accountInfo !== null) {
          if (accountInfo.mosaics.length > 0) {
            const mosaics = await this.mosaicServices.searchMosaics(accountInfo.mosaics.map(n => n.id));
            this.subscribe['block'] = this.dataBridge.getBlock().subscribe(next => this.currentBlock = next);
            if (mosaics.length > 0) {
              for (let mosaic of mosaics) {
                const currentMosaic = accountInfo.mosaics.find(element => element.id.toHex() === this.proximaxProvider.getMosaicId(mosaic.id).toHex());
                let amount = '';
                let expired = false;
                let nameExpired = '';
                if (mosaic.mosaicInfo !== null) {
                  amount = this.transactionService.amountFormatter(currentMosaic.amount, mosaic.mosaicInfo);
                  const durationMosaic = new UInt64([
                    mosaic.mosaicInfo['properties']['duration']['lower'],
                     mosaic.mosaicInfo['properties']['duration']['higher']
                  ]);

                  const createdBlock = new UInt64([
                    mosaic.mosaicInfo.height.lower,
                    mosaic.mosaicInfo.height.higher
                  ]);

                  if (durationMosaic.compact() > 0) {
                    if (this.currentBlock >= durationMosaic.compact()+createdBlock.compact()) {
                      expired = true;
                      nameExpired = ' - Expired';
                    }
                  }
                } else {
                  amount = this.transactionService.amountFormatterSimple(currentMosaic.amount.compact());
                  nameExpired = ' - Expired';
                  expired = true;
                }

                if (this.proximaxProvider.getMosaicId(mosaic.id).id.toHex() !== this.mosaicServices.mosaicXpx.mosaicId) {
                  const nameMosaic = (mosaic.mosaicNames.names.length > 0) ? mosaic.mosaicNames.names[0] : this.proximaxProvider.getMosaicId(mosaic.id).toHex();
                  mosaicsSelect.push({
                    label: `${nameMosaic}${nameExpired}`,
                    value: mosaic.id,
                    balance: amount,
                    expired: false,
                    selected: false,
                    disabled: expired
                  });
                } else {
                  this.balanceXpx = amount;
                }
              }

              this.allMosaics = mosaicsSelect;
              this.selectOtherMosaics = mosaicsSelect;
            }
          }
        }
      }
    );
  }

  /**
   *
   *
   * @memberof CreateTransferComponent
   */
  booksAddress() {
    const data = this.listContacts.slice(0);
    const bookAddress = this.serviceModuleService.getBooksAddress();
    this.listContacts = [];
    if (bookAddress !== undefined && bookAddress !== null) {
      for (let x of bookAddress) {
        data.push(x);
      }
      this.listContacts = data;
    }
  }

  /**
   *
   *
   * @memberof CreateTransferComponent
   */
  createFormTransfer() {
    this.formTransfer = this.fb.group({
      accountRecipient: ['', [
        Validators.required,
        Validators.minLength(this.configurationForm.accountRecipient.minLength),
        Validators.maxLength(this.configurationForm.accountRecipient.maxLength)
      ]],
      amountXpx: ['', [
        Validators.maxLength(this.configurationForm.amount.maxLength)
      ]],
      contact: [''],
      message: ['', [
        Validators.maxLength(this.configurationForm.message.maxLength)
      ]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(this.configurationForm.passwordWallet.minLength),
          Validators.maxLength(this.configurationForm.passwordWallet.maxLength)
        ]
      ]
    });
  }

  /**
   *
   *
   * @param {(string | (string | number)[])} [custom]
   * @param {(string | number)} [formControl]
   * @returns
   * @memberof CreateTransferComponent
   */
  clearForm(custom?: string | (string | number)[], formControl?: string | number) {
    if (custom !== undefined) {
      if (formControl !== undefined) {
        this.formTransfer.controls[formControl].get(custom).reset();
        return;
      }
      this.formTransfer.get(custom).reset();
      return;
    }

    this.formTransfer.reset();
    return;
  }

  deleteMoreMosaic(position: number) {
    const otherMosaics = [];
    Object.keys(this.otherMosaics).forEach(element => {
      if (Number(element) !== position) {
        otherMosaics.push(this.otherMosaics[Number(element)]);
      }
    });
    this.otherMosaics = otherMosaics;
  }

  /**
   *
   *
   * @param {number} position
   * @memberof CreateTransferComponent
   */
  /* deleteMoreMosaic(position: number) {
     console.log('this.otherMosaics', this.otherMosaics);
     const otherMosaics = [];
     Object.keys(this.otherMosaics).forEach(element => {
     /*  const selectOtherMosaics = [];
       this.otherMosaics[position].selectOtherMosaics.forEach(element => {
         if (element.label === this.otherMosaics[position].beforeValue) {
           element.disabled = false;
           selectOtherMosaics.push(element);
         }else {
           selectOtherMosaics.push(element);
         }
       });

       this.otherMosaics[position].selectOtherMosaics = selectOtherMosaics;*

       if (Number(element) !== position) {
         otherMosaics.push(this.otherMosaics[position]);
       }
     });
     this.otherMosaics = otherMosaics;
   }*/

  /**
   *
   *
   * @memberof CreateTransferComponent
   */
  getTransactionStatus() {
    // Get transaction status
    this.subscribe['transactionStatus'] = this.dataBridge.getTransactionStatus().subscribe(
      statusTransaction => {
        if (statusTransaction !== null && statusTransaction !== undefined && this.transactionSigned !== null) {
          const statusTransactionHash = (statusTransaction['type'] === 'error') ? statusTransaction['data'].hash : statusTransaction['data'].transactionInfo.hash;
          const match = statusTransactionHash === this.transactionSigned.hash;
          if (statusTransaction['type'] === 'confirmed' && match) {
            this.transactionSigned = null;
            this.sharedService.showSuccess('', 'Transaction confirmed');
          } else if (statusTransaction['type'] === 'unconfirmed' && match) {
            this.transactionSigned = null;
            this.sharedService.showInfo('', 'Transaction unconfirmed');
          } else if (match) {
            this.transactionSigned = null;
            this.sharedService.showWarning('', statusTransaction['data'].status.split('_').join(' '));
          }
        }
      }
    );
  }

  /**
   *
   *
   * @param {string} amount
   * @param {(string | [])} mosaicId
   * @param {number} position
   * @memberof CreateTransferComponent
   */
  modelChanged(amount: string, mosaicId: string | [], position: number) {
    if (amount !== null && amount !== undefined) {
      const mosaic = this.mosaicServices.filterMosaic(new MosaicId(mosaicId));
      const a = Number(amount);
      this.otherMosaics[position].amountToBeSent = String((mosaic !== null) ? this.transactionService.amountFormatter(a, mosaic.mosaicInfo) : a);
      this.validateAmountToTransfer(amount, mosaic, position);
    } else {
      this.otherMosaics[position].amountToBeSent = '0';
    }
  }

  /**
   *
   *
   * @param {Event} $event
   * @param {number} i
   * @memberof CreateTransferComponent
   */
  otherMosaicsChange(mosaicSelected: any, position: number) {
    if (mosaicSelected !== undefined) {
      this.otherMosaics[position].id = mosaicSelected.value;
      this.otherMosaics[position].balance = mosaicSelected.balance;



      this.otherMosaics.forEach(element => {
        const newMosaic = [];
        let otherMosaic = element.selectOtherMosaics.filter(elm => elm.label !== mosaicSelected.label);
        let currentMosaic = element.selectOtherMosaics.filter(elm => elm.label === mosaicSelected.label);
        currentMosaic.forEach(current => {
          current.disabled = true;
          newMosaic.push(current);
        });

        otherMosaic.forEach(others => {
          newMosaic.push(others);
        });

        newMosaic.forEach(element => {
          if (this.otherMosaics[position].beforeValue !== '' && element.label === this.otherMosaics[position].beforeValue) {
            element.disabled = false;
          }
        });

        element.selectOtherMosaics = newMosaic;
        /* if (this.otherMosaics[position].beforeValue !== '' && this.otherMosaics[position].beforeValue) {
           const current = this.allMosaics.find(e => e.label === this.otherMosaics[position].beforeValue);

         }*/

        /*  if (element.random !== this.otherMosaics[position].random) {
            element.selectOtherMosaics = this.selectOtherMosaics;
          }*/

        /* if (this.selectOtherMosaics.length > 0) {
           if (element.random !== this.otherMosaics[position].random) {
            /* if (this.otherMosaics[position].beforeValue !== '' && this.otherMosaics[position].beforeValue) {
               const current = this.allMosaics.find(e => e.label === this.otherMosaics[position].beforeValue);
               console.log(current);
               console.log('----this.selectOtherMosaics---', this.selectOtherMosaics);
             /*  if(Object.keys(current).length > 0) {
                 this.selectOtherMosaics.push(current);
               }*
             }*
             console.log('----this.selectOtherMosaics---', this.selectOtherMosaics);
             element.selectOtherMosaics = this.selectOtherMosaics;
           } else {
             this.otherMosaics[position].beforeValue = mosaicSelected.label;
           }
         }*/
      });

      this.otherMosaics[position].beforeValue = mosaicSelected.label;

    } else {
      this.otherMosaics[position].id = '';
      this.otherMosaics[position].balance = '';
      this.otherMosaics[position].amount = '';
      this.otherMosaics[position].errorBalance = false;
      this.otherMosaics[position].amountToBeSent = 0;
    }

    /*this.otherMosaics.forEach(element => {
      console.log('old', this.otherMosaics[position].beforeValue);
      const newMosaic = [];
      this.selectOtherMosaics = element.selectOtherMosaics.filter(elm => elm.label !== mosaicSelected.label);
      if (this.selectOtherMosaics.length > 0) {
        if (element.random !== this.otherMosaics[position].random) {
          element.selectOtherMosaics = this.selectOtherMosaics;
        }else {
          this.otherMosaics[position].beforeValue = mosaicSelected.value;
        }
      }
       console.log('old', this.otherMosaics[position].beforeValue);
    });*/
  }

  /**
   *
   *
   * @memberof CreateTransferComponent
   */
  pushedOtherMosaics() {
    if (this.selectOtherMosaics.length > 0) {
      if (this.otherMosaics.length === 0) {
        this.otherMosaics.push({
          id: '',
          balance: '',
          beforeValue: '',
          amount: '',
          errorBalance: false,
          amountToBeSent: 0,
          random: Math.floor(Math.random() * 1455654),
          selectOtherMosaics: this.selectOtherMosaics
        });
      } else {
        let x = false;
        this.otherMosaics.forEach(element => {
          if (element.id === '' || element.amount === '' || Number(element.amount) === 0) {
            x = true;
          }
        });

        if (!x) {
          this.otherMosaics.push({
            id: '',
            balance: '',
            amount: '',
            errorBalance: false,
            amountToBeSent: 0,
            random: Math.floor(Math.random() * 1455654),
            selectOtherMosaics: this.selectOtherMosaics
          });
        }
      }
    }
  }

  /**
   *
   *
   * @memberof CreateTransferComponent
   */
  sendTransfer() {
    if (this.formTransfer.valid && (!this.blockSendButton || !this.errorOtherMosaics)) {
      const mosaicsToSend = this.validateMosaicsToSend();
      this.blockSendButton = true;
      let common = { password: this.formTransfer.get("password").value };
      if (this.walletService.decrypt(common)) {
        const params: TransferInterface = {
          common: common,
          recipient: this.formTransfer.get("accountRecipient").value,
          message: (this.formTransfer.get("message").value === null) ? "" : this.formTransfer.get("message").value,
          network: this.walletService.network,
          mosaic: mosaicsToSend
        };

        const transferBuilder = this.transactionService.buildTransferTransaction(params);
        this.transactionSigned = transferBuilder.signedTransaction;
        this.clearForm();
        transferBuilder.transactionHttp.announce(transferBuilder.signedTransaction).subscribe(
          async () => {
            this.blockSendButton = false;
            if (this.subscribe['transactionStatus'] === undefined || this.subscribe['transactionStatus'] === null) {
              this.getTransactionStatus();
            }
          }, err => {
            this.blockSendButton = false;
            this.clearForm();
            this.sharedService.showError('', err);
          }
        );
      }
    }
  }

  /**
   *
   *
   * @param {*} event
   * @memberof CreateTransferComponent
   */
  selectContact(event: { label: string, value: string }) {
    if (event !== undefined && event.value !== '') {
      this.formTransfer.get('accountRecipient').patchValue(event.value);
    }
  }



  /**
   *
   *
   * @memberof CreateTransferComponent
   */
  subscribeValue() {
    // Account recipient
    this.formTransfer.get('accountRecipient').valueChanges.subscribe(
      value => {
        const accountRecipient = (value !== undefined && value !== null && value !== '') ? value.split('-').join('') : '';
        const accountSelected = (this.formTransfer.get('contact').value) ? this.formTransfer.get('contact').value.split('-').join('') : '';
        if ((accountSelected !== '') && (accountSelected !== accountRecipient)) {
          this.formTransfer.get('contact').patchValue('');
        }

        if (accountRecipient !== null && accountRecipient !== undefined && accountRecipient.length === 40) {
          if (!this.proximaxProvider.verifyNetworkAddressEqualsNetwork(this.walletService.address.plain(), accountRecipient)) {
            this.blockSendButton = true;
            this.msgErrorUnsupported = 'Recipient Address Network unsupported';
          } else {
            this.blockSendButton = false;
            this.msgErrorUnsupported = '';
          }
        } else if (!this.formTransfer.get('accountRecipient').getError("required") && this.formTransfer.get('accountRecipient').valid) {
          this.blockSendButton = true;
          this.msgErrorUnsupported = 'Recipient Address Network unsupported';
        } else {
          this.blockSendButton = false;
          this.msgErrorUnsupported = '';
        }
      }
    );

    //Amount XPX
    this.formTransfer.get('amountXpx').valueChanges.subscribe(
      value => {
        if (value !== null && value !== undefined) {
          const mosaic = this.mosaicServices.filterMosaic(new MosaicId(this.mosaicXpx.id));
          const a = Number(value);
          this.amountXpxToSend = String((mosaic !== null) ? this.transactionService.amountFormatter(a, mosaic.mosaicInfo) : a);
          // this.validateAmountToTransfer(value, mosaic);
          let validateAmount = false;
          const accountInfo = this.walletService.getAccountInfo();
          if (accountInfo !== undefined && accountInfo !== null && Object.keys(accountInfo).length > 0) {
            if (accountInfo.mosaics.length > 0) {
              const filtered = accountInfo.mosaics.find(element => {
                return element.id.toHex() === new MosaicId(mosaic.id).toHex();
              });

              if (filtered !== undefined && filtered !== null) {
                const invalidBalance = filtered.amount.compact() < Number(value);
                if (invalidBalance && !this.insufficientBalance) {
                  this.insufficientBalance = true;
                  this.blockSendButton = true;
                } else if (!invalidBalance && this.insufficientBalance) {
                  this.insufficientBalance = false;
                  this.blockSendButton = false;
                }
              } else {
                validateAmount = true;
              }
            } else {
              validateAmount = true;
            }
          } else {
            validateAmount = true;
          }

          if (validateAmount) {
            if (Number(value) >= 1) {
              this.insufficientBalance = true;
              this.blockSendButton = true;
            } else if ((Number(value) === 0 || value === '') && this.insufficientBalance) {
              this.insufficientBalance = false;
            }
          }
        } else {
          this.amountXpxToSend = '0.000000';
        }
      }
    );
  }


  /**
   *
   *
   * @param {*} amount
   * @param {MosaicsStorage} mosaic
   * @memberof CreateTransferComponent
   */
  validateAmountToTransfer(amount: string, mosaic: MosaicsStorage, position: number) {
    let validateAmount = false;
    const accountInfo = this.walletService.getAccountInfo();
    if (accountInfo !== undefined && accountInfo !== null && Object.keys(accountInfo).length > 0) {
      if (accountInfo.mosaics.length > 0) {
        const filtered = accountInfo.mosaics.find(element => {
          return element.id.toHex() === new MosaicId(mosaic.id).toHex();
        });

        if (filtered !== undefined && filtered !== null) {
          const invalidBalance = filtered.amount.compact() < Number(amount);
          if (invalidBalance && !this.otherMosaics[position].errorBalance) {
            this.otherMosaics[position].errorBalance = true;
            this.errorOtherMosaics = true;
          } else if (!invalidBalance && this.otherMosaics[position].errorBalance) {
            this.otherMosaics[position].errorBalance = false;
            this.errorOtherMosaics = false;
          }
        } else {
          validateAmount = true;
        }
      } else {
        validateAmount = true;
      }
    } else {
      validateAmount = true;
    }

    if (validateAmount) {
      if (Number(amount) >= 1) {
        this.otherMosaics[position].errorBalance = true;
        this.errorOtherMosaics = true;
      } else if ((Number(amount) === 0 || amount === '') && this.otherMosaics[position].errorBalance) {
        this.otherMosaics[position].errorBalance = false;
      }
    }
  }

  /**
   *
   *
   * @returns
   * @memberof CreateTransferComponent
   */
  validateMosaicsToSend() {
    const mosaics = [];
    const amountXpx = this.formTransfer.get("amountXpx").value;
    if (amountXpx !== '') {
      mosaics.push({
        id: this.mosaicXpx.id,
        amount: amountXpx
      });
    }

    this.otherMosaics.forEach(element => {
      if (element.id !== '' && element.amount !== '') {
        mosaics.push({
          id: element.id,
          amount: element.amount
        });
      }
    });

    return mosaics;
  }

  /**
   *
   *
   * @param {string} [nameInput='']
   * @param {string} [nameControl='']
   * @param {string} [nameValidation='']
   * @returns
   * @memberof CreateTransferComponent
   */
  validateInput(nameInput: string = '', nameControl: string = '', nameValidation: string = '') {
    let validation: AbstractControl = null;
    if (nameInput !== '' && nameControl !== '') {
      validation = this.formTransfer.controls[nameControl].get(nameInput);
    } else if (nameInput === '' && nameControl !== '' && nameValidation !== '') {
      validation = this.formTransfer.controls[nameControl].getError(nameValidation);
    } else if (nameInput !== '') {
      validation = this.formTransfer.get(nameInput);
    }
    return validation;
  }
}