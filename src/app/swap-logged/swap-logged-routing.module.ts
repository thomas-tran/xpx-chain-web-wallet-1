import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppConfig } from '../config/app.config';
import { Nis1AccountsListComponent } from '../swap/views/nis1-accounts-list/nis1-accounts-list.component';
import { Nis1TransferAssetsComponent } from '../swap/views/nis1-transfer-assets/nis1-transfer-assets.component';
import { Nis1CosignerAccountsComponent } from '../swap/views/nis1-cosigner-accounts/nis1-cosigner-accounts.component';
import { Nis1AccountFoundComponent } from '../swap/views/nis1-account-found/nis1-account-found.component';

const routes: Routes = [{
  path: AppConfig.routes.swapAccountList,
  component: Nis1AccountsListComponent,
  data: {
    meta: {
      title: 'swapAccountNis1Found.title',
      description: 'swapAccountNis1Found.text',
      override: true,
    },
  }
}, {
  path: `${AppConfig.routes.swapTransferAssetsLogged}/:account/:type/:moreAccounts`,
  component: Nis1TransferAssetsComponent,
  data: {
    meta: {
      title: 'swapTransferAssetsLogged.title',
      description: 'swapTransferAssetsLogged.text',
      override: true,
    },
  }
}, {
  path: AppConfig.routes.swapListCosigners,
  component: Nis1CosignerAccountsComponent,
  data: {
    meta: {
      title: 'swapListCosigners.title',
      description: 'swapListCosigners.text',
      override: true,
    },
  }
},{
  path: AppConfig.routes.swapAccountFound,
  component: Nis1AccountFoundComponent,
  data: {
    meta: {
      title: 'swapAccountFound.title',
      description: 'swapAccountFound.text',
      override: true,
    },
  }
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SwapLoggedRoutingModule { }
