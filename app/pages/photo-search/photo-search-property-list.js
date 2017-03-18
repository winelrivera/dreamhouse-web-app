import {Page, NavController, NavParams} from 'ionic-angular';
import {PropertyDetailsPage} from '../property-details/property-details';
import {prettifyProperty} from '../../services/property-service';

@Page({
  templateUrl: 'build/pages/property-list/property-list.html'
})
export class PhotoSearchPropertyListPage {

  static get parameters() {
    return [[NavController], [NavParams]];
  }

  constructor(nav, navParams) {
    this.nav = nav;
    this.properties = navParams.get('properties') .map(prettifyProperty);
  }

  itemTapped(event, property) {
    this.nav.push(PropertyDetailsPage, {
      property: property
    });
  }

}
