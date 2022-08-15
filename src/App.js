import './App.css';
import { useEffect, useState } from 'react';
import todolist from './TodoList.json';
import { BigNumber, ethers, utils } from "ethers";

const App = () => {
  const contract_address = "0xd6643aD09303290558303FCc38e6e8f87272B6CD";
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [provider, setProvider] = useState("");
  const [contract, setContract] = useState("");

  const [taskName, setTaskName] = useState("");

  const [tasks, setTasks] = useState([]);
  const [load, setLoad] = useState(false);

  const verifyConn = () => {
    window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then((result) => {
        setAddress(result[0]);
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  useEffect(() => {
    verifyConn();
    if (address) {
      if (!contract) {
        createProvider();
      }

    }

  }, [address]);

  const getTasks = async (contract) => {
    setLoad(true)
    const totalTask = await contract.taskCount();
    console.log(parseInt(Number(totalTask.toHexString())))

    var data = [];
    for (var i = 1; i <= totalTask; i++) {
      const element = await contract.tasks(i);
      const obj = {
        id: parseInt(Number(element[0])),
        name: element[1],
        status: element[2]
      }
      data.push(obj);
    }
    setTasks(data);
    setLoad(false)

  }

  const createProvider = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    const signer = await provider.getSigner();
    const contrato = new ethers.Contract(
      contract_address,
      todolist,
      signer
    );
    setContract(contrato);
    getTasks(contrato);
  };


  const handleConnect = async () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((result) => {
          setAddress(result[0]);
        })
        .catch((error) => {
          alert(error.message);
        });

      const chainId_ = await window.ethereum.request({ method: "eth_chainId" });

      await window.ethereum
        .request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x3" }],
        })
        .then((e) => {
          setChainId(chainId_);
        });
    } else {
      console.log("Need to install MetaMask");
      alert("Please install MetaMask browser extension to interact");
    }
    verifyConn();
  };

  const radioclick = async (i) => {
    try {
      const txn = await contract.toggleStatus(i.id)
        .catch((er) => {
          alert(er.error.message);
        });
      await txn.wait();
      getTasks(contract);
    } catch (er) {
      alert(er);
    } finally {
      setLoad(false);
    }
  }

  const handlePostTask = async () => {
    if (!taskName) {
      alert('set a taskName!');
    } else {
      try {
        const txn = await contract.createTask(taskName)
          .catch((er) => {
            alert(er.error.message);
          });
        await txn.wait();
        getTasks(contract);
        setTaskName("")
      } catch (er) {
        alert(er);
      } finally {
        setLoad(false);
      }
    }
  }

  return (
    <div className="App">
      <div className="App-header">
        <h2>Dapp to test Smart Contract</h2>
        <label>
          {`This Contract is running in `}
          <a href='https://ropsten.etherscan.io/address/0xd6643ad09303290558303fcc38e6e8f87272b6cd' target='_blank'>Ropsten Etherscan</a>
        </label>
        <a href='https://github.com/joaosobanski/windows-ethereum-blockchain-development-front' target='_blank'>GitHub Project Front End</a>
        <a href='https://github.com/joaosobanski/windows-ethereum-blockchain-development' target='_blank'>GitHub Project Back End</a>
        <body className='body'>
          {!address &&
            <button onClick={handleConnect}>Connect wallet</button>
          }
          {
            address &&
            <div>
              <div>
                <input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Task Name" />
                <button onClick={handlePostTask}>Post Task</button>
              </div>
              <div className='col'>
                {
                  tasks.map(i =>
                    <div key={i.id}>
                      <input type="radio" checked={i.status} onClick={e => radioclick(i)} />
                      <label>{i.name}</label>
                    </div>
                  )
                }
              </div>
            </div>
          }
        </body>
      </div>
    </div>
  );
}

export default App;
