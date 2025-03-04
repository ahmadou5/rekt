"use client";
import * as RadioGroup from "@radix-ui/react-radio-group";

import { IRelayPKP } from "@lit-protocol/types";
import { useState } from "react";

interface AccountSelectionProp {
  accounts: IRelayPKP[];
  setCurrentAccount: (account: IRelayPKP) => void;
  error?: Error;
}

export default function AccountSelection({
  accounts,
  setCurrentAccount,
  error,
}: AccountSelectionProp) {
  const [selectedValue, setSelectedValue] = useState<string>("0");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = accounts[parseInt(selectedValue)];
    return setCurrentAccount(account);
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        <h1 className="text-white/90 text-2xl">Choose your account</h1>
        <p className="text-white/70 mt-3 text-lg font-medium">
          Continue with one of your accounts.
        </p>
        <form onSubmit={handleSubmit} className="">
          <RadioGroup.Root
            className="accounts-wrapper"
            defaultValue="0"
            onValueChange={setSelectedValue}
            aria-label="View accounts"
          >
            {accounts.map((account, index) => (
              <div
                key={`account-${index}`}
                className={` ${
                  selectedValue === index.toString() && "account-item--selected"
                }`}
              >
                <RadioGroup.Item
                  className="account-item__radio"
                  value={index.toString()}
                  id={account.ethAddress}
                >
                  {" "}
                  <RadioGroup.Indicator className="account-item__indicator" />
                </RadioGroup.Item>
                <label className="text-white/85" htmlFor={account.ethAddress}>
                  {account.publicKey.toString()}
                </label>
              </div>
            ))}
          </RadioGroup.Root>
          <button type="submit" className="text-white ">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
