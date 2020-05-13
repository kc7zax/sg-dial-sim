import { Injectable } from "@angular/core";
import { AddressSet, DefaultAddressSet, Destination, Glyph } from "app/shared/models";
import { isEqual, uniqWith } from "lodash";
import { ElectronService } from "ngx-electron";

@Injectable()
export class GateNetworkService {
	private addressSets: AddressSet[];

	constructor(private electron: ElectronService) {
		this.initAddressSets();
	}

	public getActiveAddress(address: Glyph[]): Destination {
		if (address.length < 7) {
			return null;
		}

		let sixSymbolMatches = this.getAllAddresses();
		for (let i = 0; i < 6; i++) {
			sixSymbolMatches = sixSymbolMatches.filter((d) => d.address[i].position === address[i].position);
		}

		if (sixSymbolMatches.length === 0) {
			return null;
		} else if (address.length === 7) {
			return sixSymbolMatches.filter((m) => m.address.length === 6)[0];
		}
	}

	public getAllAddresses(): Destination[] {
		const addresses = this.addressSets.reduce(
			(addresses: Destination[], set: AddressSet) => addresses.concat(set.destinations),
			[],
		);
		return uniqWith(addresses, (value, other) => isEqual(value.address, other.address));
	}

	public getDestinationById(id: number): Destination {
		return DefaultAddressSet.find((d) => d.id === id);
	}

	private async initAddressSets(): Promise<void> {
		const setsFromStorage = await this.electron.ipcRenderer.invoke("getStoreValue", "addressSets");
		if (!setsFromStorage) {
			this.addressSets = [{ destinations: DefaultAddressSet, enabled: true, name: "Default" }];
			this.saveAddressSets();
		} else {
			this.addressSets = setsFromStorage;
		}
	}

	private saveAddressSets(): void {
		this.electron.ipcRenderer.invoke("setStoreValue", "addressSets", this.addressSets);
	}
}
