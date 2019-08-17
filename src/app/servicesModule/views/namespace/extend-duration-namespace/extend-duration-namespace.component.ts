import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { SignedTransaction, MosaicId } from 'tsjs-xpx-chain-sdk';
import { NamespacesService } from '../../../services/namespaces.service';
import { AppConfig } from '../../../../config/app.config';
import { DataBridgeService } from '../../../../shared/services/data-bridge.service';
import { ProximaxProvider } from '../../../../shared/services/proximax.provider';
import { MosaicService } from '../../../services/mosaic.service';
import { SharedService, ConfigurationForm } from '../../../../shared/services/shared.service';
import { WalletService } from '../../../../wallet/services/wallet.service';
import { TransactionsService } from '../../../../transfer/services/transactions.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-extend-duration-namespace',
  templateUrl: './extend-duration-namespace.component.html',
  styleUrls: ['./extend-duration-namespace.component.css']
})
export class ExtendDurationNamespaceComponent implements OnInit {

  moduleName = 'Namespaces & Sub-Namespaces';
  componentName = 'EXTEND DURATION';
  backToService = `/${AppConfig.routes.service}`;
  extendDurationNamespaceForm: FormGroup;
  configurationForm: ConfigurationForm = {};
  arrayselect: Array<object> = [
    {
      value: '1',
      label: 'New root Namespace',
      selected: true,
      disabled: true
    }
  ];
  namespaceSelect: Array<object> = [];
  calculateRentalFee: any = '0.000000';
  rentalFee = 100000;
  feeType: string = 'XPX';
  durationByBlock = '0';
  insufficientBalance = false;
  namespaceChangeInfo: any = [];
  startHeight: number = 0;
  endHeight: number = 0;
  block: number = 0;
  blockBtnSend: boolean = false;
  fee = '';
  titleInformation = 'Namespace Information';
  subscription: Subscription[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private sharedService: SharedService,
    private namespaceService: NamespacesService,
    private dataBridgeService: DataBridgeService,
    private walletService: WalletService,
    private proximaxProvider: ProximaxProvider,
    private transactionService: TransactionsService,
    private mosaicServices: MosaicService
  ) { }

  ngOnInit() {
    this.configurationForm = this.sharedService.configurationForm;
    this.fee = `0.000000 ${this.feeType}`;
    this.createForm();
    this.getNamespaces();
    const duration = this.extendDurationNamespaceForm.get('duration').value;
    this.durationByBlock = this.transactionService.calculateDurationforDay(duration).toString();
    this.validateRentalFee(this.rentalFee * duration);
    this.extendDurationNamespaceForm.get('duration').valueChanges.subscribe(next => {
      if (next !== null && next !== undefined && String(next) !== '0') {
        this.durationByBlock = this.transactionService.calculateDurationforDay(next).toString();
        this.validateRentalFee(this.rentalFee * parseFloat(this.durationByBlock));
      } else {
        this.calculateRentalFee = '0.000000';
        this.durationByBlock = '0';
        this.extendDurationNamespaceForm.get('duration').patchValue('');
      }
    });

    // namespaceRoot ValueChange
    this.extendDurationNamespaceForm.get('namespaceRoot').valueChanges.subscribe(namespaceRoot => {
      if (namespaceRoot === null || namespaceRoot === undefined) {
        this.extendDurationNamespaceForm.get('namespaceRoot').setValue('');
      } else {
        this.durationByBlock = this.transactionService.calculateDurationforDay(this.extendDurationNamespaceForm.get('duration').value).toString();
        this.validateRentalFee(this.rentalFee * parseFloat(this.durationByBlock));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroySubscription();
  }

  /**
   *
   *
   * @memberof ExtendDurationNamespaceComponent
   */
  createForm() {
    // Form Renew Namespace
    this.extendDurationNamespaceForm = this.fb.group({
      namespaceRoot: ['', [Validators.required]],
      duration: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(this.configurationForm.passwordWallet.minLength),
        Validators.maxLength(this.configurationForm.passwordWallet.maxLength)
      ]],
    });
  }

  /**
   *
   *
   * @memberof ExtendDurationNamespaceComponent
   */
  clearForm() {
    this.extendDurationNamespaceForm.get('namespaceRoot').patchValue('');
    this.extendDurationNamespaceForm.get('duration').patchValue('');
    this.extendDurationNamespaceForm.get('password').patchValue('');
  }

  /**
   *
   *
   * @memberof ExtendDurationNamespaceComponent
   */
  destroySubscription() {
    this.subscription.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  /**
   *
   *
   * @memberof ExtendDurationNamespaceComponent
   */
  getNamespaces() {
    this.subscription.push(this.namespaceService.getNamespaceChanged().subscribe(
      async namespaceInfo => {
        if (namespaceInfo !== undefined && namespaceInfo !== null && namespaceInfo.length > 0) {
          const arrayselect = [];
          for (let namespaceRoot of namespaceInfo) {
            if (namespaceRoot.namespaceInfo.depth === 1) {
              arrayselect.push({
                value: `${namespaceRoot.namespaceName.name}`,
                label: `${namespaceRoot.namespaceName.name}`,
                selected: false,
                disabled: false
              });

              this.arrayselect.push({
                name: `${namespaceRoot.namespaceName.name}`,
                dataNamespace: namespaceRoot
              });
            }
          }

          this.arrayselect = arrayselect;
        }
      }, error => {
        this.router.navigate([AppConfig.routes.home]);
        this.sharedService.showError('', 'Check your connection and try again');
      }
    ));

  }

  /**
   *
   *
   * @param {*} namespace
   * @memberof ExtendDurationNamespaceComponent
   */
  optionSelected(namespace: any) {
    namespace = (namespace === undefined) ? 1 : namespace.value;
    this.namespaceChangeInfo = this.arrayselect.filter((book: any) => (book.name === namespace));
    if (this.namespaceChangeInfo.length > 0) {
      this.subscription.push(this.dataBridgeService.getBlock().subscribe(
        next => this.block = next
      ));
      this.startHeight = this.namespaceChangeInfo[0].dataNamespace.NamespaceInfo.startHeight.lower;
      this.endHeight = this.namespaceChangeInfo[0].dataNamespace.NamespaceInfo.endHeight.lower;
    }
  }

  /**
   *
   *
   * @memberof ExtendDurationNamespaceComponent
   */
  resetForm() {
    this.extendDurationNamespaceForm.get('namespaceRoot').patchValue('1');
    this.extendDurationNamespaceForm.get('duration').patchValue('');
    this.extendDurationNamespaceForm.get('password').patchValue('');
  }

  /**
   *
   *
   * @memberof ExtendDurationNamespaceComponent
   */
  extendDuration() {
    if (this.extendDurationNamespaceForm.valid && !this.blockBtnSend) {
      this.blockBtnSend = true;
      const common = {
        password: this.extendDurationNamespaceForm.get('password').value,
        privateKey: ''
      }
      if (this.walletService.decrypt(common)) {
        this.proximaxProvider.announce(this.signedTransaction(common)).subscribe(
          () => {
            this.blockBtnSend = false;
            this.resetForm();
            this.sharedService.showSuccess('', 'Transaction sent')
          }, () => {
            this.blockBtnSend = false;
            this.resetForm();
            this.sharedService.showError('', 'An unexpected error has occurred');
          }
        );
      } else {
        this.blockBtnSend = false;
      }
    }
  }

  /**
   *
   *
   * @param {string} [nameInput='']
   * @param {string} [nameControl='']
   * @param {string} [nameValidation='']
   * @returns
   * @memberof ExtendDurationNamespaceComponent
   */
  validateInput(nameInput: string = '', nameControl: string = '', nameValidation: string = '') {
    let validation: AbstractControl = null;
    if (nameInput !== '' && nameControl !== '') {
      validation = this.extendDurationNamespaceForm.controls[nameControl].get(nameInput);
    } else if (nameInput === '' && nameControl !== '' && nameValidation !== '') {
      validation = this.extendDurationNamespaceForm.controls[nameControl].getError(nameValidation);
    } else if (nameInput !== '') {
      validation = this.extendDurationNamespaceForm.get(nameInput);
    }
    return validation;
  }


  /**
   *
   *
   * @param {*} common
   * @returns {SignedTransaction}
   * @memberof ExtendDurationNamespaceComponent
   */
  signedTransaction(common: any): SignedTransaction {
    const account = this.proximaxProvider.getAccountFromPrivateKey(common.privateKey, this.walletService.currentAccount.network);
    const namespaceRootToExtend: string = this.extendDurationNamespaceForm.get('namespaceRoot').value;
    // const duration: number = parseFloat(this.durationByBlock);
    const duration: number = parseFloat(this.durationByBlock);
    const extendNamespaceRootTransaction = this.proximaxProvider.registerRootNamespaceTransaction(namespaceRootToExtend, this.walletService.currentAccount.network, duration);
    const signedTransaction = account.sign(extendNamespaceRootTransaction);
    return signedTransaction;
  }

  /**
   *
   *
   * @param {*} amount
   * @param {MosaicsStorage} mosaic
   * @memberof ExtendDurationNamespaceComponent
   */
  validateRentalFee(amount: number) {
    const accountInfo = this.walletService.filterAccountInfo();
    if (
      accountInfo && accountInfo.accountInfo &&
      accountInfo.accountInfo.mosaics && accountInfo.accountInfo.mosaics.length > 0
    ) {
      if (accountInfo.accountInfo.mosaics.length > 0) {
        const filtered = accountInfo.accountInfo.mosaics.find(element => {
          return element.id.toHex() === new MosaicId(this.proximaxProvider.mosaicXpx.mosaicId).toHex();
        });

        if (filtered) {
          const invalidBalance = filtered.amount.compact() < amount;
          const mosaic = this.mosaicServices.filterMosaic(filtered.id);
          this.calculateRentalFee = this.transactionService.amountFormatter(amount, mosaic.mosaicInfo);
          if (invalidBalance && !this.insufficientBalance) {
            this.insufficientBalance = true;
            this.extendDurationNamespaceForm.controls['password'].disable();
          } else if (!invalidBalance && this.insufficientBalance) {
            this.insufficientBalance = false;
            this.extendDurationNamespaceForm.controls['password'].enable();
          }
        } else {
          this.sharedService.showWarning('', 'You do not have enough balance in the default account');
          this.router.navigate([`/${AppConfig.routes.service}`]);
        }
      } else {
        this.insufficientBalance = true;
        this.extendDurationNamespaceForm.controls['password'].disable();
      }
    } else {
      this.sharedService.showWarning('', 'You do not have enough balance in the default account');
      this.router.navigate([`/${AppConfig.routes.service}`]);
    }
  }

}