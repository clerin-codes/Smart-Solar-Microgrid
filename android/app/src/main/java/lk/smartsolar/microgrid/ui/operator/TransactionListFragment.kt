package lk.smartsolar.microgrid.ui.operator

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import lk.smartsolar.microgrid.R

/**
 * Fragment for displaying transaction list
 */
class TransactionListFragment : Fragment() {

    private lateinit var viewModel: TransactionViewModel
    private lateinit var transactionRecyclerView: RecyclerView
    private lateinit var transactionAdapter: TransactionAdapter
    private lateinit var progressBar: ProgressBar
    private lateinit var emptyStateView: LinearLayout
    private lateinit var errorTextView: TextView
    private lateinit var statusSpinner: Spinner
    private lateinit var refreshButton: Button
    private lateinit var previousButton: Button
    private lateinit var nextButton: Button
    private lateinit var pageInfoTextView: TextView

    private var currentPage = 1
    private var currentStatusFilter: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_transaction_list, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        initializeViews(view)
        initializeViewModel()
        setupRecyclerView()
        setupClickListeners()
        observeViewModel()

        // Load initial transactions
        viewModel.fetchTransactions(page = 1)
    }

    private fun initializeViews(view: View) {
        transactionRecyclerView = view.findViewById(R.id.transaction_recycler_view)
        progressBar = view.findViewById(R.id.progress_bar)
        emptyStateView = view.findViewById(R.id.empty_state_view)
        errorTextView = view.findViewById(R.id.error_text_view)
        statusSpinner = view.findViewById(R.id.status_spinner)
        refreshButton = view.findViewById(R.id.refresh_button)
        previousButton = view.findViewById(R.id.previous_button)
        nextButton = view.findViewById(R.id.next_button)
        pageInfoTextView = view.findViewById(R.id.page_info_text_view)
    }

    private fun initializeViewModel() {
        viewModel = ViewModelProvider(this).get(TransactionViewModel::class.java)
    }

    private fun setupRecyclerView() {
        transactionAdapter = TransactionAdapter(
            onTransactionClick = { transaction ->
                viewModel.fetchTransactionDetails(transaction.id)
                // Navigate to detail fragment or show detail
                showTransactionDetail(transaction)
            }
        )
        transactionRecyclerView.layoutManager = LinearLayoutManager(context)
        transactionRecyclerView.adapter = transactionAdapter
    }

    private fun setupClickListeners() {
        refreshButton.setOnClickListener {
            viewModel.fetchTransactions(page = 1, statusFilter = currentStatusFilter)
            currentPage = 1
        }

        previousButton.setOnClickListener {
            if (currentPage > 1) {
                viewModel.loadPreviousPage(currentStatusFilter)
                currentPage--
            }
        }

        nextButton.setOnClickListener {
            viewModel.loadNextPage(currentStatusFilter)
            currentPage++
        }

        statusSpinner.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: View?, position: Int, id: Long) {
                currentStatusFilter = parent?.getItemAtPosition(position).toString().takeIf { it != "All" }
                viewModel.fetchTransactions(page = 1, statusFilter = currentStatusFilter)
                currentPage = 1
            }

            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
        })
    }

    private fun observeViewModel() {
        // Observe transaction state
        viewModel.transactionState.observe(viewLifecycleOwner) { state ->
            when (state) {
                TransactionState.Loading -> {
                    progressBar.visibility = View.VISIBLE
                    transactionRecyclerView.visibility = View.GONE
                    emptyStateView.visibility = View.GONE
                    errorTextView.visibility = View.GONE
                }
                TransactionState.Success -> {
                    progressBar.visibility = View.GONE
                    transactionRecyclerView.visibility = View.VISIBLE
                    errorTextView.visibility = View.GONE
                }
                TransactionState.Error -> {
                    progressBar.visibility = View.GONE
                    errorTextView.visibility = View.VISIBLE
                    transactionRecyclerView.visibility = View.GONE
                }
                else -> {}
            }
        }

        // Observe transaction list
        viewModel.transactionList.observe(viewLifecycleOwner) { transactions ->
            if (transactions.isEmpty()) {
                emptyStateView.visibility = View.VISIBLE
                transactionRecyclerView.visibility = View.GONE
            } else {
                emptyStateView.visibility = View.GONE
                transactionRecyclerView.visibility = View.VISIBLE
                transactionAdapter.submitList(transactions)
            }
            pageInfoTextView.text = "Page: $currentPage"
        }

        // Observe errors
        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                errorTextView.text = "Error: $it"
                Log.e("TransactionListFragment", error)
            }
        }
    }

    private fun showTransactionDetail(transaction: TransactionModel) {
        Toast.makeText(
            context,
            "Transaction: ${transaction.id}\nAmount: Rs. ${transaction.amount}",
            Toast.LENGTH_LONG
        ).show()
    }

    companion object {
        fun newInstance(): TransactionListFragment {
            return TransactionListFragment()
        }
    }
}

/**
 * RecyclerView Adapter for Transactions
 */
class TransactionAdapter(
    private val onTransactionClick: (TransactionModel) -> Unit
) : RecyclerView.Adapter<TransactionAdapter.TransactionViewHolder>() {

    private val transactions = mutableListOf<TransactionModel>()

    fun submitList(newTransactions: List<TransactionModel>) {
        transactions.clear()
        transactions.addAll(newTransactions)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TransactionViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_transaction, parent, false)
        return TransactionViewHolder(view, onTransactionClick)
    }

    override fun onBindViewHolder(holder: TransactionViewHolder, position: Int) {
        holder.bind(transactions[position])
    }

    override fun getItemCount(): Int = transactions.size

    class TransactionViewHolder(
        itemView: View,
        private val onTransactionClick: (TransactionModel) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {

        private val idTextView: TextView = itemView.findViewById(R.id.transaction_id)
        private val amountTextView: TextView = itemView.findViewById(R.id.transaction_amount)
        private val statusTextView: TextView = itemView.findViewById(R.id.transaction_status)
        private val timestampTextView: TextView = itemView.findViewById(R.id.transaction_timestamp)

        fun bind(transaction: TransactionModel) {
            idTextView.text = "ID: ${transaction.id.take(8)}..."
            amountTextView.text = "Rs. ${transaction.amount}"
            statusTextView.text = "Status: ${transaction.status}"
            timestampTextView.text = transaction.timestamp

            itemView.setOnClickListener {
                onTransactionClick(transaction)
            }
        }
    }
}
