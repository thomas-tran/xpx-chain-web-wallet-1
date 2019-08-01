import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppConfig } from "../../app/config/app.config";
import { ExplorerComponent } from './views/explorer/explorer.component';
import { ServicesBoxComponent } from "./views/services-box/services-box.component"
import { DetailAccountComponent } from './views/account/detail-account/detail-account.component';
import { CreateNamespaceComponent } from './views/namespace/create-namespace/create-namespace.component';
import { RenewNamespaceComponent } from './views/namespace/renew-namespace/renew-namespace.component';
import { AddressBookComponent } from './views/address-book/address-book.component';
import { CreateMosaicComponent } from './views/mosaic/create-mosaic/create-mosaic.component';
import { AliasAddressToNamespaceComponent } from './views/account/alias-address-to-namespace/alias-address-to-namespace.component';
import { MosaicsSupplyChangeComponent } from './views/mosaic/mosaics-supply-change/mosaics-supply-change.component';
import { AliasMosaicsToNamespaceComponent } from './views/mosaic/alias-mosaics-to-namespace/alias-mosaics-to-namespace.component';

const routes: Routes = [
  {
    path: AppConfig.routes.account,
    component: DetailAccountComponent,
    data: {
      meta: {
        title: 'detailAccount.title',
        description: 'detailAccount.text',
        override: true,
      },
    }
  },
  {
    path: AppConfig.routes.service,
    component: ServicesBoxComponent,
    data: {
      meta: {
        title: 'servicesBox.title',
        description: 'servicesBox.text',
        override: true,
      },
    }
  },
  {
    path: AppConfig.routes.explorer,
    component: ExplorerComponent,
    data: {
      meta: {
        title: 'explorer.title',
        description: 'explorer.text',
        override: true,
      }
    }
  },
  {
    path: AppConfig.routes.createNamespace,
    component: CreateNamespaceComponent,
    data: {
      meta: {
        title: 'createNamespace.title',
        description: 'createNamespace.text',
        override: true,
      }
    }
  },
  {
    path: AppConfig.routes.renewNamespace,
    component: RenewNamespaceComponent,
    data: {
      meta: {
        title: 'renewNamespace.title',
        description: 'renewNamespace.text',
        override: true,
      }
    }
  },
  {
    path: AppConfig.routes.addressBook,
    component: AddressBookComponent,
    data: {
      meta: {
        title: 'createNamespace.title',
        description: 'createNamespace.text',
        override: true,
      }
    },
  },
  
  {
    path: AppConfig.routes.createMosaic,
    component: CreateMosaicComponent,
    data: {
      meta: {
        title: 'createMosaic.title',
        description: 'createMosaic.text',
        override: true,
      }
    }
  },
  {
    path: AppConfig.routes.MosaicSupplyChange,
    component: MosaicsSupplyChangeComponent,
    data: {
      meta: {
        title: 'mosaicsSupplyChange.title',
        description: 'mosaicsSupplyChange.text',
        override: true,
      }
    }
  },
  {
    path: AppConfig.routes.LinkingNamespaceMosaic,
    component: AliasMosaicsToNamespaceComponent,
    data: {
      meta: {
        title: 'aliasMosaicsToNamespace.title',
        description: 'aliasMosaicsToNamespace.text',
        override: true,
      }
    }
  },
  {
    path: AppConfig.routes.aliasAddressToNamespace,
    component: AliasAddressToNamespaceComponent,
    data: {
      meta: {
        title: 'aliasAddressToNamespace.title',
        description: 'aliasAddressToNamespace.text',
        override: true,
      }
    }
  }

  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesModuleRoutingModule { }
