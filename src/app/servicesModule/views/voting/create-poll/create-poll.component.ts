import { Component, OnInit } from '@angular/core';
import { PublicAccount, Account, Address } from 'tsjs-xpx-chain-sdk';
import { environment } from 'src/environments/environment';
import { WalletService } from 'src/app/wallet/services/wallet.service';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ConfigurationForm, SharedService } from 'src/app/shared/services/shared.service';
import { AppConfig } from 'src/app/config/app.config';
@Component({
  selector: 'app-create-poll',
  templateUrl: './create-poll.component.html',
  styleUrls: ['./create-poll.component.css']
})
export class CreatePollComponent implements OnInit {
  showList: boolean;
  account: string;
  errorDateStart: string;
  errorDateEnd: string;
  minDate: Date;
  boxOtherAccount = [];
  createPollForm: FormGroup;
  configurationForm: ConfigurationForm = {};
  publicAccount: PublicAccount;
  btnBlock: boolean;
  Poll: PollInterface;
  option: optionsPoll[] = [];
  routes = {
    backToService: `/${AppConfig.routes.service}`
  };

  voteType: any = [{
    value: 1,
    label: 'Public',
    selected: true,
  }, {
    value: 2,
    label: 'White list',
    selected: false,
  }];

  listaBlanca: any = [{
    value: 121213231241,
    label: 'VAKYW5-55DSDQ-TGMNZA-ULW6ZA-5WCMBB-QTW5XN-PHGK',
  }, {
    value: 123123123123,
    label: 'VOIJUY-55DSDQ-TGMNZA-ULW6ZA-QWEDFR-POLKJU-OPKJ',
  }];

  constructor(
    private fb: FormBuilder,
    private sharedService: SharedService,
    private walletService: WalletService

  ) {
    this.configurationForm = this.sharedService.configurationForm;
    this.account = environment.pollsContent.address_public_test
    this.btnBlock = false;
    this.showList = false;
  }

  ngOnInit() {
    this.createForm();
    this.JSONOptions();
    
  }

  /**
   *
   *
   * @memberof CreatePollComponent
   */
  createForm() {
    //Form create multisignature default
    this.createPollForm = this.fb.group({
      tittle: ['', [Validators.required]],
      poll:[true],
      message: ['', [Validators.required,Validators.maxLength(this.configurationForm.message.maxLength)]],
      address: ['', [Validators.required]],
      PollEndDate: [0, Validators.required],
      option:['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(this.configurationForm.passwordWallet.minLength),
        Validators.maxLength(this.configurationForm.passwordWallet.maxLength)
      ]],
      voteType:[1, [ Validators.required]]
    });
    // this.validatorsCosignatory();
    // this.changeformStatus()
  }

  initOptionsDate() {

    const today = new Date();
    this.minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes());
  }

  copyMessage(message: string) {
    this.sharedService.showSuccess('', `${message} copied`);
  }

  deleteOptions(item) {
    this.option = this.option.filter(option => option != item);
  }
  
  selectType($event: Event){
    console.log('******************', $event)
    const type: any = $event;
    console.log('******************', type)
    if (type !== null && type !== undefined) {
      if(type.value === 2){
        this.showList = true;
      }else{
        this.showList = false;
      }
      
    }
  }

  confirmSelectedChangStart(event) {
    const doe = event.value;
    this.createPollForm.get('PollEndDate').reset();
    const ISOMatch = new Date(doe);
    if ((isNaN(new Date(doe).getTime()) || !ISOMatch)) {
      this.errorDateStart = 'date not valid';
      // this.validateformDateStart = true;
    } else {
      this.errorDateStart = '';
      // this.validateformDateStart = false;
      // this.createPollForm.controls.dateStart = ISOMatch;
    }
  }

  confirmSelectedChangEnd(event) {
    const doe = event.value;
    const ISOMatch = new Date(doe);
    if ((isNaN(new Date(doe).getTime()) || !ISOMatch)) {
      this.errorDateEnd = 'date not valid';
      // this.validateformDateEnd = true;
      this.createPollForm.get('PollEndDate').reset();
    } else if ((new Date(this.createPollForm.get('PollStartDate').value).getTime()) >= new Date(doe).getTime()) {
      this.errorDateEnd = 'date does not validate, it has to be greater than the start date';
      // this.validateformDateEnd = true;
      this.createPollForm.get('PollEndDate').reset();
    } else {
      this.errorDateEnd = '';
      // this.validateformDateEnd = false;
      // this.formDate.dateEnd = new Date(doe);
    }
  }

  addOptions() {
    if (this.createPollForm.get('option').valid && this.createPollForm.get('option').value != '') {
      let options = this.createPollForm.get('option').value
      this.generateOptios(options);
      this.createPollForm.patchValue({
        option:''
      })
      console.log('hahahahah', this.option)
    }
  }

  pushedOtherAccount() {
      if (this.boxOtherAccount.length === 0) {
        this.boxOtherAccount.push({
          id: Math.floor(Math.random() * 1455654),
          balance: '',
        });
      } else {
        let x = false;
        this.boxOtherAccount.forEach(element => {
          if (element.id === '') {
            this.sharedService.showWarning('', 'You must select a mosaic and place the quantity');
            x = true;
          } else if (element.amount === '' || Number(element.amount) === 0) {
            this.sharedService.showWarning('', 'The quantity of mosaics is missing');            
            x = true;
          }
        });

        if (!x) {
          this.boxOtherAccount.push({
            id: Math.floor(Math.random() * 1455654),
            balance: '',
          });
        }
      }

  }

addAddress(value) {
    this.generateAccount(value)
}

JSONAccount() {
  for (let element of this.listaBlanca) {
    this.generateAccount(element)
}
}

  JSONOptions() {

    const namesOptions = ["pizza", "hamburguesa", "pollo", "pasticho"];
    this.Poll = null;
    for (let element of namesOptions) {
      this.generateOptios(element);
    }


  }

  generateAccount(nameParam: string) {
    this.listaBlanca.push(Address.createFromRawAddress(nameParam))

  }

  generateOptios(nameParam: string) {
    let publicAccountGenerate: PublicAccount = Account.generateNewAccount(this.walletService.currentAccount.network).publicAccount;
    this.option.push({ name: nameParam, publicAccount: publicAccountGenerate })

  }

  sendPoll() {
    const common = {
      password: this.createPollForm.get('password').value,
      privateKey: ''
    }
    if (this.createPollForm.valid && !this.btnBlock) {
      if (this.walletService.decrypt(common)) {
        this.preparepoll();
      }

    }
  }


  preparepoll() {
    this.publicAccount = PublicAccount.createFromPublicKey(environment.pollsContent.public_key, this.walletService.currentAccount.network);
    this.Poll = {
      name: 'poll-1',
      desciption: 'test-1',
      id: 0,
      type: 3,
      options: this.option,
      startDate: new Date(),
      endDate: new Date(),
      createdDate: new Date(),
      quantityOption: this.option.length
    }


  }
  /**
 *
 *
 * @param {string} [nameInput='']
 * @param {string} [nameControl='']
 * @param {string} [nameValidation='']
 * @returns
 * @memberof CreateNamespaceComponent
 */
  validateInput(nameInput: string = '', nameControl: string = '', nameValidation: string = '') {
    let validation: AbstractControl = null;
    if (nameInput !== '' && nameControl !== '') {
      validation = this.createPollForm.controls[nameControl].get(nameInput);
    } else if (nameInput === '' && nameControl !== '' && nameValidation !== '') {
      validation = this.createPollForm.controls[nameControl].getError(nameValidation);
    } else if (nameInput !== '') {
      validation = this.createPollForm.get(nameInput);
    }
    return validation;
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
        this.createPollForm.controls[formControl].get(custom).reset({ emitEvent: false, onlySelf: true });
        return;
      }
      this.createPollForm.get(custom).reset({ emitEvent: false, onlySelf: true });
      return;
    }
    this.createPollForm.reset({ emitEvent: false, onlySelf: true });
    return;
  }

}

/**
 * poll JSON
 * @param name - name poll
 * @param desciption - desciption poll
 * @param id - identifier
 * @param type - 0 = withe list , 1 = black list , 2 = public
 * @param startDate - poll start date
 * @param endDate - poll end date
 * @param createdDate - poll creation date
 * @param quantityOption - number of voting options
 * 
*/
export interface PollInterface {
  name: string;
  desciption: string;
  id: number;
  type: number;
  options: optionsPoll[];
  witheList?: Object[];
  blacklist?: Object[];
  startDate: Date;
  endDate: Date;
  createdDate: Date;
  quantityOption: number;
}

export interface optionsPoll {
  name: string;
  publicAccount: PublicAccount
}

