import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { UInt64, Deadline, AggregateTransaction, NetworkType, MosaicSupplyType, AliasActionType, SignedTransaction } from 'tsjs-xpx-chain-sdk';
import { ProximaxProvider } from '../../../../shared/services/proximax.provider';
import { SharedService, ConfigurationForm } from '../../../../shared/services/shared.service';
import { DataBridgeService } from '../../../../shared/services/data-bridge.service';
import { WalletService } from '../../../../wallet/services/wallet.service';
import { TransactionsService } from '../../../../transfer/services/transactions.service';
import { AppConfig } from '../../../../config/app.config';

@Component({
  selector: 'app-create-mosaic',
  templateUrl: './create-mosaic.component.html',
  styleUrls: ['./create-mosaic.component.css']
})
export class CreateMosaicComponent implements OnInit {

  @BlockUI() blockUI: NgBlockUI;
  moduleName = 'Mosaics';
  componentName = 'CREATE';
  backToService = `/${AppConfig.routes.service}`;
  configurationForm: ConfigurationForm = {};
  isOwner = false;
  mosaicForm: FormGroup;

  mosaicSupplyType: any = [{
    value: MosaicSupplyType.Increase,
    label: 'Increase',
    selected: true,
    disabled: false
  }, {
    value: MosaicSupplyType.Decrease,
    label: 'Decrease',
    selected: false,
    disabled: false
  }];
  durationByBlock = '5760';
  blockSend: boolean = false;
  transactionSigned: SignedTransaction[] = [];
  transactionReady: SignedTransaction[] = [];
  subscribe = ['transactionStatus'];

  constructor(
    private fb: FormBuilder,
    private proximaxProvider: ProximaxProvider,
    private walletService: WalletService,
    private dataBridge: DataBridgeService,
    private sharedService: SharedService,
    private transactionService: TransactionsService
  ) {
  }

  ngOnInit() {
    this.configurationForm = this.sharedService.configurationForm;
    this.createForm();
    this.mosaicForm.get('duration').valueChanges.subscribe(next => {
      this.durationByBlock = this.transactionService.calculateDurationforDay(next).toString();
    });
  }

  ngOnDestroy(): void {
    this.subscribe.forEach(element => {
      if (this.subscribe[element] !== undefined) {
        this.subscribe[element].unsubscribe();
      }
    });
  }



  /**
   * Create form namespace
   *
   * @memberof CreateMosaicComponent
   */
  createForm() {
    this.mosaicForm = this.fb.group({
      deltaSupply: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(30)]],
      duration: ['', [Validators.required]],
      divisibility: ['', [Validators.required]],
      transferable: [false],
      supplyMutable: [false],
      levyMutable: [false]
    });
  }

  /**
   *
   *
   * @memberof CreateMosaicComponent
   */
  clearForm() {
    this.mosaicForm.get('deltaSupply').patchValue('');
    this.mosaicForm.get('password').patchValue('');
    this.mosaicForm.get('duration').patchValue('');
    this.mosaicForm.get('divisibility').patchValue('');
    this.mosaicForm.get('transferable').patchValue(false);
    this.mosaicForm.get('supplyMutable').patchValue(false);
    this.mosaicForm.get('levyMutable').patchValue(false);
  }

  send() {
    if (this.mosaicForm.valid && !this.blockSend) {
      const common = {
        password: this.mosaicForm.get('password').value,
        privateKey: ''
      }

      if (this.walletService.decrypt(common)) {
        this.blockSend = true;
        const account = this.proximaxProvider.getAccountFromPrivateKey(common.privateKey, this.walletService.network);
        const nonce = this.proximaxProvider.createNonceRandom();

        //BUILD TRANSACTION
        const mosaicDefinitionTransaction = this.proximaxProvider.buildMosaicDefinition(
          nonce,
          account,
          this.mosaicForm.get('supplyMutable').value,
          this.mosaicForm.get('transferable').value,
          this.mosaicForm.get('levyMutable').value,
          this.mosaicForm.get('divisibility').value,
          parseFloat(this.durationByBlock),
          this.walletService.network
        );

        const mosaicSupplyChangeTransaction = this.proximaxProvider.buildMosaicSupplyChange(
          mosaicDefinitionTransaction.mosaicId,
          MosaicSupplyType.Increase,
          UInt64.fromUint(this.mosaicForm.get('deltaSupply').value),
          this.walletService.network
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
          Deadline.create(),
          [
            mosaicDefinitionTransaction.toAggregate(account.publicAccount),
            mosaicSupplyChangeTransaction.toAggregate(account.publicAccount)
          ],
          this.walletService.network,
          []
        );


        this.dataBridge.setTransactionStatus(null);
        // I SIGN THE TRANSACTION
        const signedTransaction = account.sign(aggregateTransaction);
        this.transactionSigned.push(signedTransaction);
        //ANNOUNCEMENT THE TRANSACTION-
        this.proximaxProvider.announce(signedTransaction).subscribe(
          async x => {
            this.blockSend = false;
            this.mosaicForm.reset();
            this.mosaicForm.patchValue({ duration: 1 });
            this.mosaicForm.patchValue({ divisibility: 10 });
            this.mosaicForm.patchValue({ deltaSupply: 1000000 });
            if (this.subscribe['transactionStatus'] === undefined || this.subscribe['transactionStatus'] === null) {
              this.getTransactionStatus();
            }

            this.setTimeOutValidate(signedTransaction.hash);
          }, error => {
            this.blockSend = false;
          }
        );
      } else {
        this.blockSend = false;
      }
    }
  }

  setTimeOutValidate(hash: string) {
    setTimeout(() => {
      let exist = false;
      for (let element of this.transactionReady) {
        if (hash === element.hash) {
          exist = true;
        }
      }

      (exist) ? '' : this.sharedService.showWarning('', 'Error connecting to the node');
    }, 5000);
  }

  getTransactionStatus() {
    // Get transaction status
    this.subscribe['transactionStatus'] = this.dataBridge.getTransactionStatus().subscribe(
      statusTransaction => {
        if (statusTransaction !== null && statusTransaction !== undefined && this.transactionSigned !== null) {
          for (let element of this.transactionSigned) {
            const statusTransactionHash = (statusTransaction['type'] === 'error') ? statusTransaction['data'].hash : statusTransaction['data'].transactionInfo.hash;
            const match = statusTransactionHash === element.hash;
            if (match) {
              this.transactionReady.push(element);
            }
            if (statusTransaction['type'] === 'confirmed' && match) {
              this.transactionSigned = this.transactionSigned.filter(el => el.hash !== statusTransactionHash);
              this.sharedService.showSuccess('', 'Transaction confirmed');
            } else if (statusTransaction['type'] === 'unconfirmed' && match) {
              this.sharedService.showInfo('', 'Transaction unconfirmed');
            } else if (match) {
              this.transactionSigned = this.transactionSigned.filter(el => el.hash !== statusTransactionHash);
              this.sharedService.showWarning('', statusTransaction['data'].status.split('_').join(' '));
            }
          }
        }
      }
    );
  }

  validateInput(nameInput: string = '', nameControl: string = '', nameValidation: string = '') {
    let validation: AbstractControl = null;
    if (nameInput !== '' && nameControl !== '') {
      validation = this.mosaicForm.controls[nameControl].get(nameInput);
    } else if (nameInput === '' && nameControl !== '' && nameValidation !== '') {
      validation = this.mosaicForm.controls[nameControl].getError(nameValidation);
    } else if (nameInput !== '') {
      validation = this.mosaicForm.get(nameInput);
    }
    return validation;
  }
}
