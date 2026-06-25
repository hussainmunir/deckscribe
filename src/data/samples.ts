export interface SamplePaper {
  id: string;
  title: string;
  author: string;
  wordCount: number;
  text: string;
}

export const SAMPLE_PAPERS: SamplePaper[] = [
  {
    id: "lora",
    title: "LoRA: Low-Rank Adaptation of Large Language Models",
    author: "Edward J. Hu, Yibin Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen (Microsoft)",
    wordCount: 1650,
    text: `ABSTRACT
An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to particular tasks or domains. As we pre-train larger models, full fine-tuning, which retrains all model parameters, becomes less feasible. Using GPT-3 175B as an example -- obtaining and deploying independent instances of fine-tuned models, each with 175 billion parameters, is prohibitively expensive.

We propose Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks. Compared to GPT-3 175B fine-tuned with Adam, LoRA can reduce the number of trainable parameters by 10,000 times and the GPU memory requirement by 3 times.

LoRA performs on-par or better than fine-tuning on RoBERTa, DeBERTa, GPT-2, and GPT-3, despite having fewer trainable parameters, no additional inference latency, and keeping the input sequence length unaltered. We also provide an empirical investigation into rank-deficiency in language model adaptation, which sheds light on why LoRA works so effectively.

INTRODUCTION & PROBLEM FORMULATION
Many applications in Natural Language Processing (NLP) rely on adapting one large, pre-trained foundation language model to multiple downstream scenarios. The standard strategy is to initialize with general pre-trained weights and update all parameter variables (Full Fine-Tuning). However, this presents immense challenges:
1. Storage limits: Storing separate 175B parameter files for 20 specialized tasks needs 3.5 Terabytes of VRAM/HDD space.
2. Compute constraints: Backpropagation gradients must be stored for all parameters, making Adam optimization exceptionally memory dense.

Existing parameter-efficient training protocols attempt to resolve this via:
- Adapters: Adding small feed-forward layers sequentially inside each Transformer module. This introduces extra computational layers and creates non-trivial sequential inference latency.
- Prefix-Tuning: Inserting virtual key-value vectors at the start of keys/values. This reduces the usable context sequence window length, limiting the capacity to feed long documents.

LORA DESIGN AND EQUATION MECHANICS
LoRA addresses storage and inference bottlenecks by parameterizing the weight updates. 
Let the pre-trained weight matrix be W_0 of shape d * k. We constrain its update dW by representing it with a lower-rank decomposition:
W = W_0 + dW = W_0 + B * A
where B is a d * r matrix and A is an r * k matrix, with the rank r much smaller than raw dimensions (r << min(d, k)).

During training, W_0 is kept completely frozen and receives no gradient updates. Only B and A contain trainable weight parameters.
Let's track the forward pass calculation for a simple matrix-vector product h = W_0 * x:
h = W_0 * x + dW * x = W_0 * x + B * A * x

Initialization:
- We initialize the matrix A utilizing a random Gaussian distribution.
- We initialize the matrix B to be completely zero.
Consequently, when training commences, the product dW = B * A is exactly zero, ensuring h = W_0 * x initially.
We then scale the update by an alpha factor: B * A * (alpha / r). This scaling factor helps minimize the necessity of retuning hyperparameters when altering the target rank r.

BENEFITS OF MATRIX DECOMPOSITION IN TRANSFORMERS
1. Generalizability: A single large pre-trained model instance can be loaded into memory. We can swiftly switch downstream tasks simply by swapping the tiny matrices A and B in 24MB, instead of reloading the entire 350GB dense model.
2. Cost efficiency: Trainable parameter count decreases by 99.9%. Lower gradients memory reduces active consumer H100 requirements.
3. No Latency Penalty: During deployment, we can literally fold the matrices B * A directly into the frozen W_0 weight array via W_0 = W_0 + B * A. Hence no dynamic forward computation overhead is run.

CRITIQUE AND LIMITATIONS OF LORA MODELING
While LoRA is immensely popular, rigorous evaluator reviews highlight technical constraints:
- Input Heterogeneity: It is difficult to batch requests for multiple different downstream adapter formulations (e.g. running task A on sample 1 and task B on sample 2 in the exact same batch step), because weight updates are folded or calculated uniformly.
- Single Parameter Class Bias: Most standard implementations restrict LoRA adapters strictly to attention projection weights (W_q, W_v) and ignore Multi-Layer Perceptrons (MLP), suggesting unbacked assumptions about the underlying distribution of task-specific representation updates.
`
  },
  {
    id: "attention",
    title: "Attention Is All You Need",
    author: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin (Google)",
    wordCount: 1530,
    text: `ABSTRACT
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.

Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2.0 BLEU.

THE CORE OF TRANSFORMER MECHANICS
The Transformer follows an overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.

Attention is defined as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

We call our particular attention 'Scaled Dot-Product Attention'. The input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the matrix of outputs as:
Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V

Why divided by the square root of d_k?
We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients. To counteract this effect, we scale the dot products by 1 / sqrt(d_k).

MULTI-HEAD ATTENTION MECHANICS
Instead of performing a single attention function with d-dimensional queries, keys and values, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to d_k, d_k and d_v dimensions, respectively.
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W_O
where head_i = Attention(Q * W_Q_i, K * W_K_i, V * W_V_i)

This allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this.

ADVANTAGES OF SELF-ATTENTION
We compare self-attention layers to recurrent and convolutional layers commonly used for mapping one variable-length sequence of symbol representations to another sequence. We use three criteria:
1. Total computational complexity per layer.
2. Amount of computation that can be parallelized, measured by the minimum number of sequential operations required.
3. Path length between long-range dependencies in the network. Learning long-range dependencies is a key challenge in many sequence transduction tasks. The shorter the path, the easier it is for the neural network to learn dependencies.

CRITIQUE AND EXPERIMENTAL VULNERABILITIES
Despite revolutionary breakthroughs, several flaws in Transformer's core methodology exist:
- Quadratic Complexity: The self-attention matrix calculation scales quadratically as O(N^2) where N is the sequence length, representing an unbacked scaling assumption for infinitely long documents.
- Positional Bias: The absence of inherent recurrent structure requires manual sinusoidal positional encodings, adding synthetic absolute coordinates that hinder true relative structural awareness.
- Strict Gating: No dynamic gating layer regulates what context to pass, forcing high computation on irrelevant filler tokens.
`
  }
];
