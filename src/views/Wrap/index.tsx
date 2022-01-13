import { SvgIcon, Grid, IconButton, OutlinedInput, InputAdornment, Zoom } from "@material-ui/core";
import { useCallback, useEffect, useState } from "react";
import { ReactComponent as XIcon } from "../../assets/icons/x.svg";
import { ReactComponent as ArrowsIcon } from "../../assets/icons/arrows.svg";
import "./wrap.scss";
import { useDispatch, useSelector } from "react-redux";
import { IReduxState } from "../../store/slices/state.interface";
import { trim } from "../../helpers";
import { Skeleton } from "@material-ui/lab";
import { calcWrapDetails, changeWrap, changeApproval, calcWrapPrice } from "../../store/slices/wrap-slice";
import { useWeb3Context } from "../../hooks";
import { warning } from "../../store/slices/messages-slice";
import { messages } from "../../constants/messages";
import { IPendingTxn, isPendingTxn, txnButtonText } from "../../store/slices/pending-txns-slice";

function Wrap() {
    const dispatch = useDispatch();
    const { provider, address, chainID, checkWrongNetwork } = useWeb3Context();

    const [value, setValue] = useState("");

    const isAppLoading = useSelector<IReduxState, boolean>(state => state.app.loading);

    const memoBalance = useSelector<IReduxState, string>(state => {
        return state.account.balances && state.account.balances.memo;
    });
    const wmemoBalance = useSelector<IReduxState, string>(state => {
        return state.account.balances && state.account.balances.wmemo;
    });

    const wrapValue = useSelector<IReduxState, string>(state => {
        return state.wrapping && state.wrapping.wrapValue;
    });

    const wrapPrice = useSelector<IReduxState, number>(state => {
        return state.wrapping && state.wrapping.wrapPrice;
    });

    const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(state => {
        return state.pendingTransactions;
    });

    const memoAllowance = useSelector<IReduxState, number>(state => {
        return state.account.wrapping && state.account.wrapping.memo;
    });

    const [isWrap, setIsWrap] = useState(true);
    const [isWrapPrice, setIsWrapPrice] = useState(true);

    const setMax = () => {
        if (isWrap) {
            setValue(memoBalance);
        } else {
            setValue(wmemoBalance);
        }
    };

    const handleSwap = () => {
        setValue("");
        const value = !isWrap;
        setIsWrap(value);
        setIsWrapPrice(value);
    };

    const handleValueChange = (e: any) => {
        const value = e.target.value;
        setValue(value);
    };

    useEffect(() => {
        dispatch(calcWrapDetails({ isWrap, provider, value, networkID: chainID }));
    }, [value]);

    useEffect(() => {
        dispatch(calcWrapPrice({ isWrap: isWrapPrice, provider, networkID: chainID }));
    }, [isWrapPrice]);

    const onClose = () => {
        setValue("");
        setIsWrap(true);
        setIsWrapPrice(true);
        dispatch(calcWrapDetails({ isWrap, provider, value: "", networkID: chainID }));
    };

    const hasAllowance = useCallback(() => memoAllowance > 0, [memoAllowance]);

    const trimmedMemoBalance = trim(Number(memoBalance), 6);
    const trimmedWmemoBalance = trim(Number(wmemoBalance), 6);

    const getBalance = () => (isWrap ? `${trimmedMemoBalance} MEMO` : `${trimmedWmemoBalance} wMEMO`);

    const handleOnWrap = async () => {
        if (await checkWrongNetwork()) return;

        if (value === "" || parseFloat(value) === 0) {
            dispatch(warning({ text: isWrap ? messages.before_wrap : messages.before_unwrap }));
        } else {
            await dispatch(changeWrap({ isWrap, value, provider, networkID: chainID, address }));
            setValue("");
        }
    };

    const onSeekApproval = async () => {
        if (await checkWrongNetwork()) return;

        await dispatch(changeApproval({ address, provider, networkID: chainID }));
    };

    return (
        <div className="wrap-view">
            <Zoom in={true}>
                <div className="wrap-card">
                    <Grid className="wrap-card-grid" container direction="column" spacing={2}>
                        <Grid item>
                            <div className="wrap-card-header">
                                <p className="wrap-card-header-title">{isWrap ? "Wrap MEMO" : "Unwrap wMEMO"}</p>
                            </div>
                        </Grid>

                        <Grid item>
                            <div className="wrap-card-metrics">
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={6} lg={6}>
                                        <div className="wrap-card-conversion">
                                            <p className="wrap-card-metrics-title">Conversion Rate</p>
                                            <p className="wrap-card-metrics-value">
                                                {isAppLoading ? (
                                                    <Skeleton width="120px" />
                                                ) : (
                                                    `1 ${isWrapPrice ? "MEMO" : "wMEMO"} = ${`${trim(wrapPrice, 4)} ${isWrapPrice ? "wMEMO" : "MEMO"}`}`
                                                )}
                                            </p>
                                        </div>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={6} lg={6}>
                                        <div className="wrap-card-balance">
                                            <p className="wrap-card-metrics-title">Your Balance</p>
                                            <p className="wrap-card-metrics-value">{isAppLoading ? <Skeleton width="120px" /> : <>{getBalance()}</>}</p>
                                        </div>
                                    </Grid>
                                </Grid>
                            </div>
                        </Grid>
                    </Grid>

                    <div className="wrap-container">
                        <OutlinedInput
                            placeholder="Amount"
                            value={value}
                            onChange={handleValueChange}
                            fullWidth
                            type="number"
                            className="bond-input wrap-input"
                            startAdornment={
                                <InputAdornment position="start">
                                    <div className="wrap-action-input-text">
                                        <p>{isWrap ? "MEMO" : "wMEMO"}</p>
                                    </div>
                                </InputAdornment>
                            }
                            endAdornment={
                                <InputAdornment position="end">
                                    <div onClick={setMax} className="wrap-action-input-btn">
                                        <p>Max</p>
                                    </div>
                                </InputAdornment>
                            }
                        />
                        <div className="wrap-toggle">
                            <IconButton onClick={handleSwap}>
                                <SvgIcon color="primary" component={ArrowsIcon} />
                            </IconButton>
                        </div>
                        <OutlinedInput
                            placeholder="Amount"
                            value={wrapValue}
                            disabled
                            fullWidth
                            type="number"
                            className="bond-input wrap-input"
                            startAdornment={
                                <InputAdornment position="start">
                                    <div className="wrap-action-input-text">
                                        <p>{isWrap ? "wMEMO" : "MEMO"}</p>
                                    </div>
                                </InputAdornment>
                            }
                        />
                        {hasAllowance() ? (
                            <div
                                className="wrap-btn"
                                onClick={() => {
                                    const inPending = isWrap ? isPendingTxn(pendingTransactions, "wrapping") : isPendingTxn(pendingTransactions, "unwrapping");
                                    if (inPending) return;
                                    handleOnWrap();
                                }}
                            >
                                <p>{isWrap ? txnButtonText(pendingTransactions, "wrapping", "Wrap") : txnButtonText(pendingTransactions, "unwrapping", "Unwrap")}</p>
                            </div>
                        ) : (
                            <div
                                className="wrap-btn"
                                onClick={() => {
                                    if (isPendingTxn(pendingTransactions, "approve_wrapping")) return;
                                    onSeekApproval();
                                }}
                            >
                                <p>{txnButtonText(pendingTransactions, "approve_wrapping", "Approve")}</p>
                            </div>
                        )}
                        {!hasAllowance() && (
                            <div className="wrap-help-text">
                                <p>Note: The "Approve" transaction is only needed when</p>
                                <p>wrapping for the first time; subsequent wrapping only</p>
                                <p>requires you to perform the "Wrap" transaction.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Zoom>
        </div>
    );
}

export default Wrap;
