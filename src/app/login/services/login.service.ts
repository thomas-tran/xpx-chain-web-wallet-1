import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { WalletService } from '../../shared/services/wallet.service';
import { AppConfig } from '../../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  logged: boolean;
  isLoggedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.logged);
  isLogged$: Observable<boolean> = this.isLoggedSubject.asObservable();

  constructor(
    private _walletService: WalletService,
    private route: Router
  ) { }
  /**
   *
   *
   * @param {*} wallets
   * @returns
   * @memberof LoginService
   */
  public walletsOption(wallets: any) {
    const retorno = [];
    wallets.forEach((item, index) => {
      retorno.push({ value: item, label: item.name });

    });
    return retorno;
  }
  /**
   * Método para loguear usuario
   *
   * @param {*} common
   * @param {*} wallet
   * @returns
   * @memberof LoginService
   */

  public login(common, wallet) {
    if (!this._walletService.login(common, wallet)) { return false; }
    // this._DataBridgeService.connect();
    this.route.navigate([`/${AppConfig.routes.dashboard}`]);
    this.setLogged(true);
    return true;
  }


  /**
   *permitir cargar el componente en el enrutamiento
   *
   * @param {*} params
   * @memberof LoginService
   */
  public setLogged(params) {
    this.logged = params;
    this.isLoggedSubject.next(this.logged);
  }

  /**
   *establecer valor para logueo y deslogueo
   *
   * @returns
   * @memberof LoginService
   */
  public getIsLogged() {
    return this.isLogged$;
  }

}
