(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TERMS u101)
(define-constant ERR-INVALID-RECIPIENTS u102)
(define-constant ERR-INVALID-FUNDS u103)
(define-constant ERR-INVALID-MILESTONES u104)
(define-constant ERR-AGREEMENT-ALREADY-EXISTS u105)
(define-constant ERR-AGREEMENT-NOT-FOUND u106)
(define-constant ERR-INVALID-TIMESTAMP u107)
(define-constant ERR-ALREADY-SIGNED u108)
(define-constant ERR-INVALID-PARTY u109)
(define-constant ERR-MAX-AGREEMENTS_EXCEEDED u110)
(define-constant ERR-INVALID-GOALS u111)
(define-constant ERR-INVALID-CONDITIONS u112)
(define-constant ERR-INVALID-DURATION u113)
(define-constant ERR-INVALID-PENALTIES u114)
(define-constant ERR-INVALID-REWARDS u115)
(define-constant ERR-INVALID-OVERSEERS u116)
(define-constant ERR-INVALID-AMENDMENT u117)
(define-constant ERR-AMENDMENT-NOT-ALLOWED u118)
(define-constant ERR-INVALID-SIGNATURE-COUNT u119)
(define-constant ERR-AGREEMENT-EXPIRED u120)
(define-constant ERR-INVALID-STATUS u121)
(define-constant ERR-INVALID-CURRENCY u122)
(define-constant ERR-INVALID-EXCHANGE-RATE u123)
(define-constant ERR-INVALID-REPORTING-INTERVAL u124)
(define-constant ERR-INVALID-DISPUTE_PERIOD u125)

(define-data-var next-agreement-id uint u0)
(define-data-var max-agreements uint u500)
(define-data-var creation-fee uint u5000)
(define-data-var admin-principal principal tx-sender)

(define-map agreements
  uint
  {
    creator: principal,
    recipients: (list 20 principal),
    overseers: (list 10 principal),
    terms: (string-utf8 1000),
    goals: (string-utf8 500),
    conditions: (string-utf8 500),
    total-funds: uint,
    currency: (string-ascii 3),
    milestones: (list 10 { description: (string-utf8 200), amount: uint, deadline: uint }),
    duration: uint,
    penalties: (string-utf8 300),
    rewards: (string-utf8 300),
    created-at: uint,
    signed-count: uint,
    status: (string-ascii 20),
    exchange-rate: uint,
    reporting-interval: uint,
    dispute-period: uint
  }
)

(define-map agreements-by-terms-hash
  (buff 32)
  uint)

(define-map agreement-signatures
  uint
  (list 30 principal))

(define-map agreement-amendments
  uint
  {
    amendment-terms: (string-utf8 1000),
    amendment-timestamp: uint,
    amender: principal
  }
)

(define-read-only (get-agreement (id uint))
  (map-get? agreements id))

(define-read-only (get-agreement-amendments (id uint))
  (map-get? agreement-amendments id))

(define-read-only (get-agreement-signatures (id uint))
  (map-get? agreement-signatures id))

(define-read-only (is-agreement-exists (h (buff 32)))
  (is-some (map-get? agreements-by-terms-hash h)))

(define-private (validate-terms (t (string-utf8 1000)))
  (if (> (len t) u0)
      (ok true)
      (err ERR-INVALID-TERMS)))

(define-private (validate-recipients (r (list 20 principal)))
  (if (and (> (len r) u0) (<= (len r) u20))
      (ok true)
      (err ERR-INVALID-RECIPIENTS)))

(define-private (validate-overseers (o (list 10 principal)))
  (if (<= (len o) u10)
      (ok true)
      (err ERR-INVALID-OVERSEERS)))

(define-private (validate-funds (f uint))
  (if (> f u0)
      (ok true)
      (err ERR-INVALID-FUNDS)))

(define-private (validate-milestones (m (list 10 { description: (string-utf8 200), amount: uint, deadline: uint })))
  (if (and (> (len m) u0) (<= (len m) u10))
      (ok true)
      (err ERR-INVALID-MILESTONES)))

(define-private (validate-goals (g (string-utf8 500)))
  (if (> (len g) u0)
      (ok true)
      (err ERR-INVALID-GOALS)))

(define-private (validate-conditions (c (string-utf8 500)))
  (if (> (len c) u0)
      (ok true)
      (err ERR-INVALID-CONDITIONS)))

(define-private (validate-duration (d uint))
  (if (> d u0)
      (ok true)
      (err ERR-INVALID-DURATION)))

(define-private (validate-penalties (p (string-utf8 300)))
  (if (> (len p) u0)
      (ok true)
      (err ERR-INVALID-PENALTIES)))

(define-private (validate-rewards (rw (string-utf8 300)))
  (if (> (len rw) u0)
      (ok true)
      (err ERR-INVALID-REWARDS)))

(define-private (validate-currency (cur (string-ascii 3)))
  (if (or (is-eq cur "USD") (is-eq cur "EUR") (is-eq cur "BTC"))
      (ok true)
      (err ERR-INVALID-CURRENCY)))

(define-private (validate-exchange-rate (er uint))
  (if (> er u0)
      (ok true)
      (err ERR-INVALID-EXCHANGE-RATE)))

(define-private (validate-reporting-interval (ri uint))
  (if (> ri u0)
      (ok true)
      (err ERR-INVALID-REPORTING-INTERVAL)))

(define-private (validate-dispute-period (dp uint))
  (if (> dp u0)
      (ok true)
      (err ERR-INVALID-DISPUTE_PERIOD)))

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP)))

(define-public (set-max-agreements (new-max uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-principal)) (err ERR-NOT-AUTHORIZED))
    (var-set max-agreements new-max)
    (ok true)))

(define-public (set-creation-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin-principal)) (err ERR-NOT-AUTHORIZED))
    (var-set creation-fee new-fee)
    (ok true)))

(define-public (create-agreement 
  (recipients (list 20 principal)) 
  (overseers (list 10 principal))
  (terms (string-utf8 1000)) 
  (goals (string-utf8 500))
  (conditions (string-utf8 500))
  (total-funds uint)
  (currency (string-ascii 3))
  (milestones (list 10 { description: (string-utf8 200), amount: uint, deadline: uint }))
  (duration uint)
  (penalties (string-utf8 300))
  (rewards (string-utf8 300))
  (exchange-rate uint)
  (reporting-interval uint)
  (dispute-period uint))
  (let ((next-id (+ (var-get next-agreement-id) u1))
        (terms-hash (sha256 terms)))
    (asserts! (< (var-get next-agreement-id) (var-get max-agreements)) (err ERR-MAX-AGREEMENTS-EXCEEDED))
    (try! (validate-recipients recipients))
    (try! (validate-overseers overseers))
    (try! (validate-terms terms))
    (try! (validate-goals goals))
    (try! (validate-conditions conditions))
    (try! (validate-funds total-funds))
    (try! (validate-currency currency))
    (try! (validate-milestones milestones))
    (try! (validate-duration duration))
    (try! (validate-penalties penalties))
    (try! (validate-rewards rewards))
    (try! (validate-exchange-rate exchange-rate))
    (try! (validate-reporting-interval reporting-interval))
    (try! (validate-dispute-period dispute-period))
    (asserts! (is-none (map-get? agreements-by-terms-hash terms-hash)) (err ERR-AGREEMENT-ALREADY-EXISTS))
    (map-set agreements (var-get next-agreement-id)
      {
        creator: tx-sender,
        recipients: recipients,
        overseers: overseers,
        terms: terms,
        goals: goals,
        conditions: conditions,
        total-funds: total-funds,
        currency: currency,
        milestones: milestones,
        duration: duration,
        penalties: penalties,
        rewards: rewards,
        created-at: block-height,
        signed-count: u0,
        status: "pending",
        exchange-rate: exchange-rate,
        reporting-interval: reporting-interval,
        dispute-period: dispute-period
      })
    (map-set agreements-by-terms-hash terms-hash (var-get next-agreement-id))
    (map-set agreement-signatures (var-get next-agreement-id) (list))
    (var-set next-agreement-id next-id)
    (print { event: "agreement-created", id: (var-get next-agreement-id) })
    (ok (var-get next-agreement-id))))

(define-public (sign-agreement (agreement-id uint))
  (let ((agreement (unwrap! (map-get? agreements agreement-id) (err ERR-AGREEMENT-NOT-FOUND)))
        (signatures (unwrap! (map-get? agreement-signatures agreement-id) (err ERR-AGREEMENT-NOT-FOUND)))
        (is-recipient (index-of? (get recipients agreement) tx-sender))
        (is-overseer (index-of? (get overseers agreement) tx-sender)))
    (asserts! (or (is-some is-recipient) (is-some is-overseer)) (err ERR-INVALID-PARTY))
    (asserts! (is-none (index-of? signatures tx-sender)) (err ERR-ALREADY-SIGNED))
    (asserts! (is-eq (get status agreement) "pending") (err ERR-INVALID-STATUS))
    (map-set agreement-signatures agreement-id (append signatures tx-sender))
    (map-set agreements agreement-id
      (merge agreement { signed-count: (+ (get signed-count agreement) u1) }))
    (print { event: "agreement-signed", id: agreement-id, signer: tx-sender })
    (ok true)))

(define-public (amend-agreement (agreement-id uint) (new-terms (string-utf8 1000)))
  (let ((agreement (unwrap! (map-get? agreements agreement-id) (err ERR-AGREEMENT-NOT-FOUND)))
        (new-hash (sha256 new-terms)))
    (asserts! (is-eq (get creator agreement) tx-sender) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (get status agreement) "active") (err ERR-AMENDMENT-NOT-ALLOWED))
    (try! (validate-terms new-terms))
    (asserts! (is-none (map-get? agreements-by-terms-hash new-hash)) (err ERR-AGREEMENT-ALREADY-EXISTS))
    (map-delete agreements-by-terms-hash (sha256 (get terms agreement)))
    (map-set agreements-by-terms-hash new-hash agreement-id)
    (map-set agreements agreement-id
      (merge agreement { terms: new-terms }))
    (map-set agreement-amendments agreement-id
      {
        amendment-terms: new-terms,
        amendment-timestamp: block-height,
        amender: tx-sender
      })
    (print { event: "agreement-amended", id: agreement-id })
    (ok true)))

(define-public (activate-agreement (agreement-id uint))
  (let ((agreement (unwrap! (map-get? agreements agreement-id) (err ERR-AGREEMENT-NOT-FOUND)))
        (required-signs (+ (len (get recipients agreement)) (len (get overseers agreement)))))
    (asserts! (is-eq (get creator agreement) tx-sender) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= (get signed-count agreement) required-signs) (err ERR-INVALID-SIGNATURE-COUNT))
    (asserts! (is-eq (get status agreement) "pending") (err ERR-INVALID-STATUS))
    (map-set agreements agreement-id
      (merge agreement { status: "active" }))
    (print { event: "agreement-activated", id: agreement-id })
    (ok true)))

(define-public (expire-agreement (agreement-id uint))
  (let ((agreement (unwrap! (map-get? agreements agreement-id) (err ERR-AGREEMENT-NOT-FOUND))))
    (asserts! (is-eq tx-sender (var-get admin-principal)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> block-height (+ (get created-at agreement) (get duration agreement))) (err ERR-AGREEMENT-EXPIRED))
    (map-set agreements agreement-id
      (merge agreement { status: "expired" }))
    (print { event: "agreement-expired", id: agreement-id })
    (ok true)))

(define-read-only (get-agreement-count)
  (var-get next-agreement-id))

(define-read-only (check-agreement-existence (terms-hash (buff 32)))
  (is-some (map-get? agreements-by-terms-hash terms-hash)))