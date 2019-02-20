import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Mosaic, MosaicView, MosaicName } from 'proximax-nem2-sdk';
import { MosaicService } from '../../../servicesModule/services/mosaic.service';
import { TransactionsService } from 'src/app/transactions/service/transactions.service';

@Component({
  selector: 'app-mosaics-info',
  template: `<!-- MOSAICS -->
                <ng-container *ngIf="viewMosaicXpx">
                  <div class="mt-3">
                    <!--
                    <div class="row" *ngIf="viewMosaicXpx">
                      <div class="col-md-3">
                        <span class="fs-08rem fw-bolder"><b>Mosaic:</b></span>
                      </div>
                      <div class="col-md-9">
                        <span class="fs-08rem fw-bolder">{{mosaicXpx.mosaicInfo.namespaceName}}:{{mosaicXpx.mosaicInfo.mosaicName}}</span>
                      </div>
                    </div>-->

                    <div class="row mt-3">
                      <div class="col-md-3">
                        <span class="fs-08rem fw-bolder"><b>Amount:</b></span>
                      </div>
                      <div class="col-md-9">
                        <span class="fs-08rem fw-bolder">{{mosaicXpx.amountFormatter}} (XPX)</span>
                      </div>
                    </div>
                  </div>
                </ng-container>


                <container *ngIf="viewDetail">
                  <div class="row mt-1rem">
                    <div class="col-6">
                      <span class="fs-08rem fw-bolder"><b>Other mosaics:</b></span>
                    </div>
                  </div>

                  <div class="table-responsive table-striped ">
                    <table mdbTable id="tablePreview" class="table table-hover table-bordered table-striped table-sm z-depth-0">
                      <thead>
                        <tr>
                          <th *ngFor="let head of headElements" scope="col" class="text-align-left"><b>{{head}}</b></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr mdbTableCol *ngFor="let element of mosaicsInfo; let i = index">
                          <td class="font-size-08rem">
                            <a class="text-link mouse-pointer">{{element.id.toHex()}}</a>
                          </td>
                          <td class="font-size-08rem">{{element.mosaicInfo.namespaceName}}:{{element.mosaicInfo.mosaicName}}</td>
                          <td class="font-size-08rem">{{element.amountFormatter}}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </container>

              `
})
export class MosaicsInfoComponent implements OnInit {

  @Input() mosaicsArray = [];
  @Input() viewAmount = false;
  @Output() changeSearch = new EventEmitter();

  mosaicsInfo = [];
  viewDetail = false;
  headElements = ['Id', 'Name', 'Quantity'];
  mosaicXpx = {};
  viewMosaicXpx = false;
  constructor(
    private mosaicService: MosaicService,
    private transactionService: TransactionsService
  ) { }

  ngOnInit() {
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    console.log("mosaicsArray", this.mosaicsArray);
    this.mosaicsInfo = this.mosaicsArray.slice(0);
    this.mosaicXpx = [];
    this.viewDetail = false;
    this.viewMosaicXpx = false;
    const mosaicsId = this.mosaicsInfo.map((mosaic: Mosaic) => { return mosaic.id /*if (mosaic.id.toHex() !== 'd423931bd268d1f4') { return mosaic.id }*/ });
    const mosaicsViewCache: MosaicView[] = await this.mosaicService.searchMosaics(mosaicsId);
    if (mosaicsViewCache.length > 0) {
      console.log("mosaicsViewCache", mosaicsViewCache);
      for (let ma of this.mosaicsInfo) {
        for (let mi of mosaicsViewCache) {
          console.log("ma", ma.id.toHex());
          console.log("mi", mi.mosaicInfo.mosaicId.toHex());
          if (ma.id.toHex() === mi.mosaicInfo.mosaicId.toHex()) {
            ma['mosaicInfo'] = mi;
            if (ma.id.toHex() === 'd423931bd268d1f4') {
              ma['amountFormatter'] = this.transactionService.amountFormatter(ma.amount, ma.id, [mi.mosaicInfo]);
              this.mosaicXpx = ma;
              this.viewMosaicXpx = true;
              this.mosaicsInfo.splice(ma);
            } else {
              ma['amountFormatter'] = this.transactionService.formatNumberMilesThousands(ma.amount.compact());
            }
          }
        }
      }

      console.log("this.viewMosaicXpx", this.viewMosaicXpx);
      console.log("this.mosaicXpx", this.mosaicXpx);

      if (this.mosaicsInfo.length > 0) {
        this.viewDetail = true;
      }
    }else {
      const mosaicsName: MosaicName[] = await this.mosaicService.getNameMosaic(mosaicsId);
      console.log("Mosaic name", mosaicsName);
    }
    this.changeSearch.emit(true);
  }
}