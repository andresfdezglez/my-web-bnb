import React from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import { useState, useEffect, useRef } from "react";
import myContractManifest from "./contracts/MyContract.json";

function App() {
  const myContract = useRef(null);

  const [tikets, setTikets] = useState([]);

  const [balance, setBalance] = useState([]);

  const [balanceWei, setBalanceWei] = useState([]);

  useEffect(() => {
    initContracts();
  }, []);

  let clickBuyTiket = async (e, i) => {
    e.preventDefault();

    const bnbValue = e.target.elements[0].value;

    if (bnbValue == "") {
      alert("Debes introducir una cantidad");
      return;
    }
    if (bnbValue <= 0) {
      alert("Debes introducir una cantidad mayor que 0");
      return;
    }

    const tx = await myContract.current.buyTiket(i, {
      value: ethers.utils.parseEther(String(bnbValue)),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });
    await tx.wait();

    const tiketsUpdated = await myContract.current.getTikets();
    setTikets(tiketsUpdated);

    const balanceUpdated = await myContract.current.getBalance();
    setBalance(balanceUpdated);

    const balanceWeiUpdated = await myContract.current.getBalanceWei();
    setBalanceWei(balanceWeiUpdated);

    getAccount();
  };

  let withdrawBalance = async () => {
    const tx = await myContract.current.withdrawBalance();

    const balanceUpdated = await myContract.current.getBalance();
    setBalance(balanceUpdated);

    const balanceWeiUpdated = await myContract.current.getBalanceWei();
    setBalanceWei(balanceWeiUpdated);

    getAccount();
  };

  let initContracts = async () => {
    await getBlockchain();
    let tiketsFromBlockchain = await myContract.current.getTikets();
    setTikets(tiketsFromBlockchain);

    const balanceUpdated = await myContract.current.getBalance();
    setBalance(balanceUpdated);

    const balanceWeiUpdated = await myContract.current.getBalanceWei();
    setBalanceWei(balanceWeiUpdated);

    getAccount();
  };

  /**
   *
   * Ejercicio 4
   *
   */
  let getWalletBalance = async (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.utils.formatEther(balance);

    document.getElementById("walletbnb").innerText = balanceInEth;
  };

  let getAccount = async () => {
    let provider = await detectEthereumProvider();
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    let activeAccount = 0;
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log("Please connect to MetaMask.");
    } else if (accounts[0] !== activeAccount) {
      activeAccount = accounts[0];
    }
    getWalletBalance(activeAccount);
  };

  let changeAdmin = async (e) => {
    //evita que avance a la página del formulario
    e.preventDefault();

    const newAdmin = e.target.elements[0].value;

    //Llamamos al contrato para modificar el admin
    const changeAdmin = await myContract.current.changeAdmin(newAdmin).then(
      (result) => {},
      (error) => {
        alert(error.data.message);
      }
    );
    await changeAdmin.wait();
  };

  /**
   *
   * Ejercicio 7
   *
   */
  let bookTiket = async (i) => {
    myContract.current.bookTiket(i).then(
      //ej 1
      (result) => {},
      (error) => {
        alert(error.data.message);
      }
    );
  };

  /**
   *
   * Ejercicio 8
   *
   */
  let transferTiket = async (e) => {
    //evita que avance a la página del formulario
    e.preventDefault();

    const ticketId = e.target.elements[0].value;
    const newOwner = e.target.elements[1].value;

    myContract.current.changeTiketOwner(ticketId, newOwner).then(
      (result) => {},
      (error) => {
        alert(error.data.message);
      }
    );
  };

  let getBlockchain = async () => {
    let provider = await detectEthereumProvider();
    if (provider) {
      await provider.request({ method: "eth_requestAccounts" });
      const networkId = await provider.request({ method: "net_version" });

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();

      myContract.current = new Contract(
        myContractManifest.networks[networkId].address,
        myContractManifest.abi,
        signer
      );
    }

    return null;
  };

  return (
    <div>
      <h1>Tikets store</h1>
      <button onClick={() => withdrawBalance()}>Withdraw Balance</button>
      <p>Balance: {String(balance)}</p>
      <p>Balance (wei): {String(balanceWei)}</p>
      <p>
        Balance de tu Wallet: <span id="walletbnb"></span> BNB{" "}
      </p>
      <ul>
        {tikets.map((address, i) => (
          <li>
            Tiket {i} comprado por {address}
            {address == ethers.constants.AddressZero && (
              <div>
                <form
                  className="form-inline"
                  onSubmit={(e) => clickBuyTiket(e, i)}
                >
                  <input type="number" step="0.01" />
                  <button type="submit"> Buy </button>
                </form>
                <a href="#" onClick={() => bookTiket(i)}>
                  {" "}
                  Book
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form className="form-inline" onSubmit={(e) => changeAdmin(e)}>
        <input type="text" />
        <button type="submit"> Change Admin </button>
      </form>

      <form className="form-inline" onSubmit={(e) => transferTiket(e)}>
        <input type="number" />
        <input type="text" />
        <button type="submit"> Transfer </button>
      </form>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
