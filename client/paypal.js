window.paypal
        .Buttons({
            async createOrder() {
            try {
                var v = ""
                var lp = 0
                try {
                  var lpbox = document.getElementById("LP") // Is null if there is no lp value
                  lp = Number(lpbox.value)
                } catch{
                  console.log("No lpbox")
                }

                var wins = document.getElementById("quantity").value

                if (document.getElementById("duobutton").checked == true){
                    v = "D"
                }
                else{
                    v = "S"
                }
                console.log(game, rankStore, divisionStore, v, wins, lp)
                const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // use the "body" param to optionally pass additional order information
                // like product ids and quantities
                body: JSON.stringify({
                    cart: [
                    {
                        id: "YOUR_PRODUCT_ID",
                        quantity: 1,
                        game: game,
                        start: `${rankStore[0]}+${divisionStore[0]}`,
                        end: `${rankStore[1]}+${divisionStore[1]}`,
                        duo: v,
                        addwins: wins,
                        currprogress: lp,
                        role: "",
                        character: "",
                    },
                    ],
                }),
                });
                
                const orderData = await response.json();
                
                console.log(orderData.id)
                if (orderData.id) {
                return orderData.id;
                } else {
                const errorDetail = orderData?.details?.[0];
                const errorMessage = errorDetail
                    ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                    : JSON.stringify(orderData);
                
                throw new Error(errorMessage);
                }
            } catch (error) {
                console.error(error);
                resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`);
            }
            },
            async onApprove(data, actions) {
            try {
                const response = await fetch(`/api/orders/${data.orderID}/capture`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                });
                
                const orderData = await response.json();
                // Three cases to handle:
                //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                //   (2) Other non-recoverable errors -> Show a failure message
                //   (3) Successful transaction -> Show confirmation or thank you message
                
                const errorDetail = orderData?.details?.[0];
                
                if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                return actions.restart();
                } else if (errorDetail) {
                // (2) Other non-recoverable errors -> Show a failure message
                throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
                } else if (!orderData.purchase_units) {
                throw new Error(JSON.stringify(orderData));
                } else {
                // (3) Successful transaction -> Show confirmation or thank you message
                // Or go to another URL:  actions.redirect('thank_you.html');
                window.location.href = `/signup/${orderData.id}`
                }
            } catch (error) {
                console.error(error);
                resultMessage(
                `Sorry, your transaction could not be processed...<br><br>${error}`,
                );
            }
            },
        })
        .render("#paypal-button-container");