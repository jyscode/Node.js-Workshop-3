import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyConverter = () => {
    const [rates, setRates] = useState([]);
    const [amount, setAmount] = useState(1);
    const [fromCurrency, setFromCurrency] = useState('KRW');
    const [toCurrency, setToCurrency] = useState('JPY(100)');
    const [convertedAmount, setConvertedAmount] = useState(0);
    const [message, setMessage] = useState('');


    useEffect(() => {

        const getApi = async () => {

            try {
                const response = await axios.get('/banking/api')
                setRates(response.data)
            } catch (e) {
                console.error("There was an error fetching the exchange rates!", e);
            }
        }
        getApi()

    }, []);

    const handleExchange = async () => {
        const token = sessionStorage.getItem('token');

        try {
            const response = await axios.post('/banking/exchange', {
                fromCurrency,
                toCurrency,
                amount,
                convertedAmount
        }, {
            headers: {
                'authorization': `Bearer ${token}`
            }
        })
        setMessage(`Successfully exchanged! You received ${response.data.amount} ${toCurrency}`);
    } catch (error) {
        console.error('Error during exchange:', error);
        setMessage('Failed to exchange currency.');
    }

    };

    useEffect(() => {
        const convertToNumber = (str) => parseFloat(str.replace(/,/g, ''));

        // 선택된 통화의 환율을 KRW 기준으로 가져오기
        const getRate = (currency) => {
            const rate = rates.find(rate => rate.cur_unit === currency);
            return rate ? convertToNumber(rate.deal_bas_r) : 1;
        };

        const fromRate = getRate(fromCurrency);
        const toRate = getRate(toCurrency);

        console.log(fromRate, toRate)
        const numericAmount = Number(amount);

        if (fromRate && toRate && !isNaN(numericAmount)) {
            // KRW 기준으로 환산: (출발 통화 / 대상 통화) * 입력 금액
            setConvertedAmount(numericAmount * (fromRate / toRate));
        } else {
            setConvertedAmount(0);  // 환율 정보가 없거나 잘못된 경우 기본값으로 0 설정
        }
    }, [amount, fromCurrency, toCurrency, rates]);

    return (
        <div>
            <div>
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
                <select
                    value={fromCurrency}
                    onChange={e => {
                        console.log(e.target.value)
                        setFromCurrency(e.target.value)
                    }
                    }
                >
                    {rates.map(rate => (
                        <option key={rate.cur_unit} value={rate.cur_unit}>
                            {rate.cur_unit}
                        </option>
                    ))}
                </select>
                to
                <select
                    value={toCurrency}
                    onChange={e => setToCurrency(e.target.value)}
                >
                    {rates.map(rate => (
                        <option key={rate.cur_unit} value={rate.cur_unit}>
                            {rate.cur_unit}
                        </option>
                    ))}
                </select>
                <button onClick={handleExchange}>Exchange</button>
                {message && <p>{message}</p>}
            </div>
            <div>
                <h2>{amount} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}</h2>
            </div>
            <div>
                <h3>Fetched Data:</h3>
                <pre>{JSON.stringify(rates, null, 2)}</pre> {/* 데이터 확인 */}
            </div>
        </div>
    );
};

export default CurrencyConverter;
